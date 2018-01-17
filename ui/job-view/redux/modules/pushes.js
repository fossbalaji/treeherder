export const types = {
  STORE_PLATFORMS: "STORE_PLATFORMS",
  SELECT_JOB: "SELECT_JOB",
};

export const actions = {
  storePlatforms: (pushId, platforms) => ({
    type: types.STORE_PLATFORMS,
    payload: {
      pushId, platforms,
    }
  }),
  selectJob: jobId => ({
    type: types.SELECT_JOB,
    payload: {
      jobId,
    }
  })
};

const initialState = {
  platforms: {},
  selectedJobId: null,
};

// As we transition away from Angular and toward React, more and more of these
// providers won't be needed.  But for now, we use these to reach into Angular
// to get the shared functionality there.
export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case types.STORE_PLATFORMS:
      return {
        ...state,
        platforms: { ...state.platforms,
                     [action.payload.pushId]: action.payload.platforms }
      };
    case types.SELECT_JOB:
      return {
        ...state,
        selectedJobId: action.payload.jobId
      };
    default:
      return state;
  }
};
