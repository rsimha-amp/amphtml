/**
 * Copyright 2017 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {loadScript, validateData} from '../../3p/3p';

/**
 * @param {!Window} global
 * @param {{
 *   blockid: string,
 *   canonical: (string|undefined),
 *   ampurl: (string|undefined),
 *   testmode: (string|undefined),
 *   referrer: (string|undefined)
 * }} data
 */
export function smi2(global, data) {
  validateData(data, ['blockid']);
  const context = /** @type {./3p/ampcontext-integration.IntegrationAmpContext} */ (global.context);
  global._smi2 = global._smi2 || {
    viewId: context.pageViewId,
    blockId: data['blockid'],
    htmlURL: data['canonical'] || context.canonicalUrl,
    ampURL: data['ampurl'] || context.sourceUrl,
    testMode: data['testmode'] || 'false',
    referrer: data['referrer'] || context.referrer,
    hostname: context.location.hostname,
    clientId: context.clientId,
    domFingerprint: context.domFingerprint,
    location: context.location,
    startTime: context.startTime,
  };
  global._smi2.AMPCallbacks = {
    renderStart: context.renderStart,
    noContentAvailable: context.noContentAvailable,
  };
  // load the smi2  AMP JS file script asynchronously
  const rand = Math.round(Math.random() * 100000000);
  loadScript(
    global,
    'https://amp.smi2.ru/ampclient/ampfecth.js?rand=' + rand,
    () => {},
    context.noContentAvailable
  );
}
