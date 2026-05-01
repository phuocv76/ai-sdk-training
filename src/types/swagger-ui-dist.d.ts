declare module "swagger-ui-dist/swagger-ui-bundle" {
  type SwaggerUiInit = {
    url: string;
    domNode: HTMLElement;
    docExpansion?: "none" | "list" | "full";
    presets?: unknown[];
    layout?: string;
  };

  type SwaggerUiInstance = {
    destroy?: () => void;
  };

  type SwaggerUiBundle = {
    (config: SwaggerUiInit): SwaggerUiInstance;
    presets: {
      apis: unknown;
    };
  };

  const SwaggerUI: SwaggerUiBundle;
  export default SwaggerUI;
}

declare module "swagger-ui-dist/swagger-ui-standalone-preset" {
  const SwaggerUIStandalonePreset: unknown;
  export default SwaggerUIStandalonePreset;
}
