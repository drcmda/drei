/* eslint-disable react-hooks/rules-of-hooks */
import * as React from 'react'

export function useContextBridge(...contexts: Array<React.Context<any>>) {
  const cRef = React.useRef<Array<React.Context<any>>>([])
  cRef.current = contexts.map((context) => React.useContext(context))
  return React.useMemo(
    () =>
      ({ children }: { children: React.ReactNode }): React.JSX.Element =>
        contexts.reduceRight(
          (acc, Context, i) => <Context.Provider value={cRef.current[i]} children={acc} />,
          children
          /*
           * done this way in reference to:
           * https://github.com/DefinitelyTyped/DefinitelyTyped/issues/44572#issuecomment-625878049
           * https://github.com/microsoft/TypeScript/issues/14729
           */
        ) as unknown as React.JSX.Element,
    []
  )
}
