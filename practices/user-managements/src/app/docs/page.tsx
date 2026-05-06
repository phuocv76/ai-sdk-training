"use client";

import { useEffect, useRef } from "react";
import SwaggerUI from "swagger-ui-dist/swagger-ui-bundle";
import SwaggerUIStandalonePreset from "swagger-ui-dist/swagger-ui-standalone-preset";

import "swagger-ui-dist/swagger-ui.css";

const ApiDocsPage = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ui = SwaggerUI({
      url: "/api/openapi.json",
      domNode: containerRef.current,
      docExpansion: "list",
      presets: [SwaggerUI.presets.apis, SwaggerUIStandalonePreset],
      layout: "BaseLayout",
    });

    return () => {
      ui?.destroy?.();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div ref={containerRef} />
    </div>
  );
};

export default ApiDocsPage;
