import { focusElement } from "oaf-side-effects";
import { ROUTES } from "global/constants";
import { RouteComponentProps } from "react-router";
import * as React from "react";

/** Are two Sets equal? */
function areSetsEqual<T>(a: ReadonlySet<T>, b: ReadonlySet<T>) {
  return a.size === b.size && [...a].every((value) => b.has(value));
}

// Component that scrolls the window to the top when changing routes.
class ScrollToTop extends React.Component<RouteComponentProps<{}>> {
  public componentDidUpdate(prevProps: RouteComponentProps<{}>) {
    if (this.props.location !== prevProps.location) {
      const path = this.props.location.pathname.replace(/\/$/, ""); // Path without trailing slash
      const prevPath = prevProps.location.pathname.replace(/\/$/, ""); // Path without trailing slash
      if (
        path === prevPath &&
        [ROUTES.Library.HOME, ROUTES.People.HOME].includes(path)
      ) {
        // We are on a search page. If the only change is to the filters, we don't want to scroll back to top.
        // Otherwise there can be an annoying scroll while the user is changing the filters.
        // But we do want to scroll back to top when the search keyword or page has changed.
        const params = new URLSearchParams(this.props.location.search);
        const oldParams = new URLSearchParams(prevProps.location.search);
        if (
          !areSetsEqual(
            new Set(params.getAll("t")),
            new Set(oldParams.getAll("t"))
          )
        ) {
          return; // Filters have changed. Don't scroll.
        }
      }
      // Set focus to the document.
      focusElement(document.documentElement);
      // Scroll back to the top of the page, or the top of the .lx-scroll-top-on-navigate element
      const el = document.querySelector(
        ".lx-scroll-top-on-navigate"
      ) as HTMLElement | null;
      window.scrollTo(0, el ? el.offsetTop : 0);
    }
  }

  public render() {
    return null;
  }
}

export { ScrollToTop };
