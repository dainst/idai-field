export type NavigationFunction<ParamsList, Routes extends keyof ParamsList> = <T extends Routes>(
    target: Routes,
    params?: ParamsList[T]) => void;