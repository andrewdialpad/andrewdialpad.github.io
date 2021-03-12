import v4 from 'https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuid.min.js';
import iframeClientUtil from './iframe_client_util.js';
import CallbackRegistry from './callback_registry.js';
import iframeConstants from './iframe_constants.js';

const REQUEST_TIMEOUT = 5000;

class BaseRequestScheduler {
  constructor (dialpadUri) {
    this.isInitialized = false;
    this.context = null;
    this.service = null;
    this.dialpadUri = dialpadUri;
    this._inFlightRequests = {};
    this.clientUid = window.name;
    this.window = window.parent;
    this.callbackRegistry = new CallbackRegistry();
  }

  /**
   * Returns Promise of data returned by DialpadClient request. Initiates
   * 'get' request to Dialpad app.
   * @param {String} path : The path of the request (e.g. 'get/user').
   */
  initiateGetRequest (path) {
    return this.initiateRequest(path, this._onGetHandleResponse.bind(this));
  }

  /**
   * Returns Promise of data returned by DialpadClient request. Initiates
   * 'init' request to Dialpad app.
   */
  initiateInitRequest () {
    return this.initiateRequest('init', this._onInitHandleResponse.bind(this));
  }

  /**
   * Returns Promise of data returned by DialpadClient request. Initiates
   * 'on' request to Dialpad app.
   * @param {String} path: The path of the request (e.g. 'on/call').
   * @param {Function} callback: The user defined method to call with the response data.
   */
  initiateOnRequest (path, callback) {
    const messageUid = v4();
    this.callbackRegistry.addCallbackToRegistry(path, callback, messageUid);

    this.initiateRequest(path, (data) => {
      this._onOnHandleResponse(data, callback);
    }, messageUid);
  }

  /**
   * Returns Promise of data returned by DialpadClient request. Initiates
   * 'off' request to Dialpad app.
   * @param {String} path : The path of the request (e.g. 'off/call').
   * @param {Function} callback : The callback which was used for the subscription being removed.
   */
  initiateOffRequest (path, callback) {
    const subscriberPath = iframeClientUtil.convertToSubscriberPath(path);
    const messageUid = this.callbackRegistry.getMessageUid(subscriberPath, callback);
    if (!messageUid) {
      iframeClientUtil.throwError('No subscription exists for path: ' + subscriberPath);
    }
    this.callbackRegistry.removeFromRegistry(subscriberPath, messageUid);
    delete this._inFlightRequests[messageUid];

    if (this.callbackRegistry.getRegisteredForPath(subscriberPath).length === 0) {
      // Request to Dialpad is only sent if we remove the last subscription, will
      // stop Dialpad sending events to this iframe.
      this.initiateRequest(path, this._onOffHandleResponse.bind(this));
    }
  }

  /**
   * Performs common actions for adding subscription postMessage responses.
   * @param {Object} data : Data object returned by postMessage.
   * @param {Function} callback : The callback to be called on returned data.
   */
  _onOnHandleResponse (data, callback) {
    throw Error('The method "_onOnHandleResponse" must be implemented by child class.');
  }

  /**
   * Returns Promise of data returned by DialpadClient request. Initiates
   * request to Dialpad app.
   * @param {String} path : The path of the request (e.g. 'get/user').
   * @param {Function} handler : The callback to be called on returned data.
   * @param {Function} messageUid : (optional) The messageUid for the postMessage.
   */
  initiateRequest (path, handler, messageUid = null) {
    return new Promise((resolve, reject) => {
      this._checkInitialized(path);
      messageUid = messageUid || v4();

      var requestTimeout = setTimeout(() => {
        const message = this._onTimeout(messageUid);
        reject(new Error(message));
      }, REQUEST_TIMEOUT);

      this._inFlightRequests[messageUid] = (data) => {
        clearTimeout(requestTimeout);
        if (iframeConstants.ERROR_STATUSES.includes(data.status_code)) {
          this.handleErrorResponse(data);
          reject(data);
        }
        handler(data);
        resolve(data.content);
      };

      this._sendRequest(path, messageUid);
    });
  }

  /**
   * Handles error responses from Dialpad.
   * @param {Object} data : Data object returned by postMessage.
   */
  handleErrorResponse (data) {
    iframeClientUtil.throwClientError('Status: ' + data.status_code, data);
  }

  /**
   * Executes handler for respective data object.
   * @param {Object} data : Data object returned by postMessage.
   */
  executeHandler (data) {
    // Check if the request has been dispatched by this client.
    if (!this._inFlightRequests[data.message_uid]) {
      iframeClientUtil.throwClientError('Unexpected response message_uid: ' + data.message_uid + ', path: ' + data.path, data);
    }
    this._inFlightRequests[data.message_uid](data);
  }

  /**
   * Handles specific 'init' response logic.
   * @param {Object} data : Data object returned by postMessage.
   */
  _onInitHandleResponse (data) {
    this.isInitialized = true;
    this.context = data.context;
    this.service = data.service;
    this._onGetHandleResponse(data);
  }

  _checkInitialized (path) {
    if (!this.isInitialized && path !== 'init') {
      iframeClientUtil.throwError('Error: Client is not Initialized.');
    }
  }

  /**
   * Performs common actions for data accessing postMessage responses.
   * @param {Object} data : Data object returned by postMessage.
   */
  _onGetHandleResponse (data) {
    delete this._inFlightRequests[data.message_uid];
  }

  /**
   * Performs common actions for removing subscription postMessage responses.
   * @param {Object} data : Data object returned by postMessage.
   */
  _onOffHandleResponse (data) {
    delete this._inFlightRequests[data.message_uid];
  }

  _sendRequest (path, messageUid) {
    this._sendData(path, messageUid);
  }

  _onTimeout (messageUid) {
    const message = 'Error: message_uid: ' + messageUid + ' has exceeded time limit.';
    console.warn(message);
    delete this._inFlightRequests[messageUid];
    return message;
  }

  _sendData (path, messageUid) {
    const data = {
      path: path,
      client_uid: this.clientUid,
      message_uid: messageUid,
      context: this.context,
      service: this.service,
    };
    this.window.postMessage(data, this.dialpadUri);
  }
}

export default BaseRequestScheduler;
