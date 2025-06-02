export interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: Record<string, any>;
}

export interface GeoJSONCollection {
  type: string;
  features: GeoJSONFeature[];
}

export interface CountyOption {
  value: number;
  label: string;
}

export interface Settlement {
  id: number;
  name: string;
  area: number;
  county: {
    name: string;
  };
  geom: any;
} 