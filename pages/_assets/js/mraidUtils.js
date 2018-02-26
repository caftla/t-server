const ifMraid = function (yes, no) {
  if (!!((typeof window != 'undefined' && window !== null) && window.mraid)) {
    return yes(window.mraid);
  } else {
    return no();
  }
}

const getMraidState = function () {
  if (!!((typeof window != 'undefined' && window !== null) && window.mraid)) {
    return window.mraid.getState();
  } else {
    return 'mraid-is-undefined';
  }
};

const getMraidViewable = () => 
  ifMraid(
      mraid => !!window.mraid.isViewable ? window.mraid.isViewable() : window.mraid.getViewable()
    , () => 'mraid-is-undefined'
  )

const getMraidVersion = () =>
  ifMraid(
      mraid => mraid.getVersion()
    , () => 'mraid-is-undefined'
  )


const addMraidViewableChangeHandler = f =>
  ifMraid(
      mraid => mraid.addEventListener('viewableChange', state => f(state))
    , () => { }
  )

const mraidViewablityChanges = (visible, hidden) =>
  addMraidViewableChangeHandler(state => state || getMraidViewable() ? visible() : hidden())

const waitForMraidToBecomeViewable = (f, waitMS = 2000) => {
  var isCalled = false;
  const call = () => {
    if(isCalled) {
      return
    } else {
      isCalled = true;
      f();
    }
  }
  ifMraid(
    mraid => {
      if (mraid.isViewable()) {
	      call();
      }
      mraidViewablityChanges(
          () => call() // visible
        , () => { } // hidden
      )
    }
    , () => call() // not MRAID
  )
}

const addMraidStateChangeHandler = f =>
  ifMraid(
      mraid => mraid.addEventListener('stateChange', _ => f(getMraidState))
    , () => { }
  )