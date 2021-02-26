/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
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
 *  height: string,
 *  type: string,
 *  width: string,
 *  publisher: string,
 *  placement: string,
 *  mode: string,
 *  article: (boolean|undefined),
 *  video: (boolean|undefined),
 *  search: (boolean|undefined),
 *  category: (boolean|undefined),
 *  homepage: (boolean|undefined),
 *  other: (boolean|undefined),
 *  referrer: (string|undefined),
 *  url: (string|undefined)
 * }} data
 */
export function taboola(global, data) {
  // do not copy the following attributes from the 'data' object
  // to _tablloa global object
  const denylist = ['height', 'type', 'width', 'placement', 'mode'];

  // ensure we have vlid publisher, placement and mode
  // and exactly one page-type
  validateData(data, [
    'publisher',
    'placement',
    'mode',
    ['article', 'video', 'photo', 'search', 'category', 'homepage', 'other'],
  ]);

  // setup default values for referrer and url
  const params = {
    referrer:
      data.referrer ||
      /** @type {./3p/ampcontext-integration.IntegrationAmpContext} */ (global.context)
        .referrer,
    url:
      data.url ||
      /** @type {./3p/ampcontext-integration.IntegrationAmpContext} */ (global.context)
        .canonicalUrl,
  };

  // copy none denylisted attribute to the 'params' map
  Object.keys(data).forEach((k) => {
    if (denylist.indexOf(k) === -1) {
      params[k] = data[k];
    }
  });

  // push the two object into the '_taboola' global
  (global._taboola = global._taboola || []).push([
    {
      viewId: /** @type {./3p/ampcontext-integration.IntegrationAmpContext} */ (global.context)
        .pageViewId,
      publisher: data.publisher,
      placement: data.placement,
      mode: data.mode,
      framework: 'amp',
      container: 'c',
    },
    params,
    {flush: true},
  ]);

  // install observation on entering/leaving the view
  /** @type {./3p/ampcontext-integration.IntegrationAmpContext} */ (global.context).observeIntersection(
    function (changes) {
      /** @type {!Array} */ (changes).forEach(function (c) {
        if (c.intersectionRect.height) {
          global._taboola.push({
            visible: true,
            rects: c,
            placement: data.placement,
          });
        }
      });
    }
  );

  // load the taboola loader asynchronously
  loadScript(
    global,
    `https://cdn.taboola.com/libtrc/${encodeURIComponent(
      data.publisher
    )}/loader.js`
  );
}
