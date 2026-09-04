declare module "react-native-safe-area-context" {
  import React from "react";
  import { ViewProps } from "react-native";

  export interface SafeAreaViewProps extends ViewProps {
    children?: React.ReactNode;
  }

  export function SafeAreaView(props: SafeAreaViewProps): React.ReactElement;
  export function useSafeAreaInsets(): {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}
