/* istanbul ignore file */

/**
 * Main entry module for the app.
 * Nothing should be exported from this file, because it runs too much
 * code when it is imported. This should only be run once, when the
 * main app loads for a user visiting the site.
 */

/* tslint:disable:ordered-imports */
import "assets/scss/base.scss";
import "assets/scss/app.scss";
/* tslint:enable:ordered-imports */

import "core-js/stable";
import "regenerator-runtime/runtime";

import { ConnectedRouter } from "connected-react-router";
import * as React from "react";
import { IntlProvider } from "react-intl";
import { Provider } from "react-redux";
import { Route } from "react-router";

import { checkLoginStatus } from "auth/actions";
import { fetchBannersNow } from "banners/actions";
import { fetchTotalPublicAssetCountNow } from "library/actions";
import { DEFAULT_UI_LANGUAGE, locale, selectFontStackForLanguage } from "i18n";
import { fetchNotificationsPoll } from "notifications/polls";
import { MainRoutes } from "routes/main";
import { GlobalMessageReporter } from "ui/components/GlobalMessageReporter/GlobalMessageReporter";
import { history } from "global/history";
import { store } from "./configureStore";
import { setStore } from "global/store";
import { handleTranslationError } from "i18n";
import { MathJaxContext } from "better-react-mathjax";

// Pollyfills for IE11 etc. fetch() API
import "whatwg-fetch"; // eslint-disable-line
import { AnalyticsProvider } from "use-analytics";
import { AnalyticsGateway, analyticsInstance } from "tracking";
import { LoginModal } from "auth/components/LxLoginView/LoginModal";
import { Usersnap } from "usersnap/components/Usersnap";
import {
  HelmetComponent,
  srNavigationAnnouncementsDiv,
} from "ui/components/Metadata/HelmetComponent";
import { ScrollToTop } from "./ScrollToTop";

// MathJax Configuration
const mathJaxOptions = {
  loader: {
    load: ["[tex]/html", "[tex]/enclose", "input/mml", "output/chtml"],
  },
  tex: {
    packages: { "[+]": ["html", "enclose"] },
    inlineMath: [
      ["\\(", "\\)"],
      ["[mathjaxinline]", "[/mathjaxinline]"],
    ],
    displayMath: [
      ["\\[", "\\]"],
      ["[mathjax]", "[/mathjax]"],
    ],
  },
  startup: {
    typeset: false,
  },
  mml: {},
};
setStore(store);

// Check if the user is logged in
checkLoginStatus(store.dispatch);

// Fetch banners
fetchBannersNow();

// Start polls
fetchNotificationsPoll();

// Set current language class on document element.
selectFontStackForLanguage();

// fetch library count
fetchTotalPublicAssetCountNow();

export const App = ({ messages }: { messages: any }) => (
  <>
    <IntlProvider
      locale={locale}
      defaultLocale={DEFAULT_UI_LANGUAGE.key}
      textComponent={React.Fragment}
      messages={messages}
      onError={handleTranslationError}
    >
      <Provider store={store}>
        <MathJaxContext
          src={"/assets/mathjax/es5/tex-chtml.js"}
          version={3}
          config={mathJaxOptions}
        >
          <AnalyticsProvider instance={analyticsInstance}>
            <ConnectedRouter history={history}>
              <>
                <AnalyticsGateway />
                <HelmetComponent />
                <Route component={ScrollToTop} />
                <MainRoutes />
                <GlobalMessageReporter />
                <LoginModal />
                {srNavigationAnnouncementsDiv}
                <Usersnap />
              </>
            </ConnectedRouter>
          </AnalyticsProvider>
        </MathJaxContext>
      </Provider>
    </IntlProvider>
  </>
);
