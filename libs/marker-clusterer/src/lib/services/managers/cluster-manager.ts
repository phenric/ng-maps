import { Injectable, NgZone } from '@angular/core';
import MarkerClusterer from '@google/markerclusterer';
import { Observable, Observer } from 'rxjs';

import {
  MapsApiWrapper,
  NgMapsMarkerComponent,
  NgMapsViewComponent,
} from '@ng-maps/core';
import { GoogleMapsMarkerManager } from '@ng-maps/google';

import { MarkerClusterComponent } from '../../directives/marker-cluster';

@Injectable({
  providedIn: NgMapsViewComponent,
})
export class ClusterManager extends GoogleMapsMarkerManager {
  private _clustererInstance: Promise<MarkerClusterer>;
  private _resolver: (value?: any) => void;

  constructor(_mapsWrapper: MapsApiWrapper, _zone: NgZone) {
    super(_mapsWrapper, _zone);
    this._clustererInstance = new Promise<MarkerClusterer>((resolver) => {
      this._resolver = resolver;
    });
  }

  public async init(options: MarkerClustererOptions): Promise<void> {
    const map = await this._mapsWrapper.getNativeMap();
    this._resolver(new MarkerClusterer(map, [], options));
  }

  /**
   * @todo fix commented options
   * @param marker
   */
  public async addMarker(marker: NgMapsMarkerComponent): Promise<void> {
    const cluster: MarkerClusterer = await this._clustererInstance;
    const markers = await this._mapsWrapper.createMarker(
      {
        lat: marker.latitude,
        lng: marker.longitude,
      },
      {
        label: marker.label,
        // draggable: marker.draggable,
        // icon: marker.iconUrl,
        // opacity: marker.opacity,
        visible: marker.visible,
        zIndex: marker.zIndex,
        title: marker.title,
        clickable: marker.clickable,
      },
      false,
    );
    cluster.addMarker(markers);
    this._markers.set(marker, markers);
  }

  public deleteMarker(marker: NgMapsMarkerComponent): Promise<void> {
    const m = this._markers.get(marker);
    if (m == null) {
      // marker already deleted
      return Promise.resolve();
    }
    this._zone.run(() => {
      m.setMap(null);
      this._clustererInstance.then((cluster) => {
        cluster.removeMarker(m);
        this._markers.delete(marker);
      });
    });
  }

  public clearMarkers(): Promise<void> {
    return this._clustererInstance.then((cluster) => {
      cluster.clearMarkers();
    });
  }

  public setGridSize(c: MarkerClusterComponent): void {
    this._clustererInstance.then((cluster) => {
      cluster.setGridSize(c.gridSize);
    });
  }

  public setMaxZoom(c: MarkerClusterComponent): void {
    this._clustererInstance.then((cluster) => {
      cluster.setMaxZoom(c.maxZoom);
    });
  }

  public setStyles(c: MarkerClusterComponent): void {
    this._clustererInstance.then((cluster) => {
      cluster.setStyles(c.styles);
    });
  }

  public setZoomOnClick(c: MarkerClusterComponent): void {
    this._clustererInstance.then((cluster) => {
      if (c.zoomOnClick !== undefined) {
        cluster.zoomOnClick_ = c.zoomOnClick;
      }
    });
  }

  public setAverageCenter(c: MarkerClusterComponent): void {
    this._clustererInstance.then((cluster) => {
      if (c.averageCenter !== undefined) {
        cluster.averageCenter_ = c.averageCenter;
      }
    });
  }

  public setImagePath(c: MarkerClusterComponent): void {
    this._clustererInstance.then((cluster) => {
      if (c.imagePath !== undefined) {
        cluster.imagePath_ = c.imagePath;
      }
    });
  }

  public setMinimumClusterSize(c: MarkerClusterComponent): void {
    this._clustererInstance.then((cluster) => {
      if (c.minimumClusterSize !== undefined) {
        cluster.minimumClusterSize_ = c.minimumClusterSize;
      }
    });
  }

  public setImageExtension(c: MarkerClusterComponent): void {
    this._clustererInstance.then((cluster) => {
      if (c.imageExtension !== undefined) {
        cluster.imageExtension_ = c.imageExtension;
      }
    });
  }

  public createClusterEventObservable<T>(
    eventName: string,
    marker: MarkerClusterComponent,
  ): Observable<T> {
    return new Observable<T>((observer: Observer<T>) => {
      this._clustererInstance.then((m: MarkerClusterer) => {
        m.addListener(eventName, (e: T) =>
          this._zone.run(() => observer.next(e)),
        );
      });
    });
  }
}
