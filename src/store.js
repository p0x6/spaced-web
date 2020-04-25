import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'
import reducers from './reducers/reducer';
import middleware from './reducers/middleware';
import { composeWithDevTools } from 'redux-devtools-extension';

const persistConfig = {
  key: 'Spaced',
  storage,
  whitelist: ['blacklistLocations', 'blacklistOnboardingStatus'],
  blacklist: ['isLogging'],
};

const persistedReducer = persistReducer(persistConfig, reducers);

const store = createStore(
  persistedReducer,
  composeWithDevTools(applyMiddleware(createLogger(), middleware())),
);

const persistor = persistStore(store);

export { store, persistor };
