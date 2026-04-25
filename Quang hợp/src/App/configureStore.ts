import { applyMiddleware, createStore, Store } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import thunk from "redux-thunk";
import { History } from "history";
import { routerMiddleware } from "connected-react-router";
import { createRootReducer, RootState } from "global/reducers";
import { history } from "global/history";

export function configureStore(
  useHistory: History,
  initialState?: RootState
): Store<RootState> {
  let middleware = applyMiddleware(routerMiddleware(useHistory), thunk);

  if (process.env.NODE_ENV !== "production") {
    middleware = composeWithDevTools(middleware);
  }

  const newStore = createStore(
    createRootReducer(history) as any,
    initialState as any,
    middleware
  ) as Store<RootState>;

  if (import.meta.hot) {
    import.meta.hot.accept("global/reducers", () => {
      import("global/reducers").then((module) => {
        const nextCreateRootReducer = module.createRootReducer; // Access named export directly
        store.replaceReducer(nextCreateRootReducer(history));
      });
    });
  }

  return newStore;
}
export const store = configureStore(history);
