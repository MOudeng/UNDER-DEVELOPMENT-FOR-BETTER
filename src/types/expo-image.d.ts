declare module "expo-image" {
  import React from "react";
  import { ViewProps } from "react-native";

  export interface ImageProps extends ViewProps {
    source?: string | number | { uri: string };
    contentFit?: "cover" | "contain" | "fill" | "scale-down";
    contentPosition?: string | number;
    placeholder?: string | number;
    placeholderContentFit?: "cover" | "contain" | "fill" | "scale-down";
    transition?: number;
    onLoad?: () => void;
    onError?: (error: Error) => void;
  }

  export function Image(props: ImageProps): React.ReactElement;
}
