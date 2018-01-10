export const types = {
  STORE_PROVIDERS: "STORE_PROVIDERS"
};

export const actions = {
  storeProviders: injector => ({
    type: types.STORE_PROVIDERS,
    meta: {
      type: 'dataStorage',
      injector
    }
  })
};

const initialState = {
  injector: null
};

// As we transition away from Angular and toward React, more and more of these
// providers won't be needed.  But for now, we use these to reach into Angular
// to get the shared functionality there.
export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case types.STORE_PROVIDERS:
      return {
        ...state,
        $rootScope: action.payload.$injector.get('$rootScope'),
        thEvents: action.payload.$injector.get('thEvents'),
        thResultStatus: action.payload.$injector.get('thResultStatus'),
        thResultStatusInfo: action.payload.$injector.get('thResultStatusInfo'),
        $location: action.payload.$injector.get('$location'),
        thJobFilters: action.payload.$injector.get('thJobFilters'),
        ThResultSetStore: action.payload.$injector.get('ThResultSetStore'),
        thAggregateIds: action.payload.$injector.get('thAggregateIds'),
        thUrl: action.payload.$injector.get('thUrl'),
        thJobModel: action.payload.$injector.get('thJobModel'),
        // TODO: move these to shared libraries
        linkifyBugsFilter: action.payload.$injector.get('$filter')('linkifyBugs'),
      };
  }
};