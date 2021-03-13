/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
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
'use strict';

const compiler = require('@ampproject/google-closure-compiler');
const gulp = require('gulp');
const {cyan, red, yellow} = require('kleur/colors');
const {getBabelCacheDir} = require('./pre-closure-babel');
const {highlight} = require('cli-highlight');
const {log, logWithoutTimestamp} = require('../common/logging');

/**
 * Logs a closure compiler error message after formatting it into a more
 * readable form by dropping the plugin's logging prefix, normalizing paths,
 * emphasizing errors and warnings, and syntax highlighting the error text.
 * @param {string} message
 */
function logClosureCompilerError(message) {
  log(red('ERROR:'));
  const babelCacheDir = `${getBabelCacheDir()}/`;
  const loggingPrefix = /^.*?gulp-google-closure-compiler.*?: /;
  const formattedMessage = message
    .replace(loggingPrefix, '')
    .replace(new RegExp(babelCacheDir, 'g'), '')
    .replace(/ ERROR /g, red(' ERROR '))
    .replace(/ WARNING /g, yellow(' WARNING '));
  logWithoutTimestamp(highlight(formattedMessage, {ignoreIllegals: true}));
}

/**
 * Handles a closure error during compilation and type checking. Passes through
 * the error except in watch mode, where we want to print a failure message and
 * continue.
 * @param {!PluginError} err
 * @param {string} outputFilename
 * @param {?Object} options
 * @return {!PluginError|undefined}
 */
function handleClosureCompilerError(err, outputFilename, options) {
  if (options.typeCheckOnly) {
    log(`${red('ERROR:')} Type checking failed`);
    return err;
  }
  log(`${red('ERROR:')} Could not minify ${cyan(outputFilename)}`);
  if (options.continueOnError) {
    options.errored = true;
    return;
  }
  return err;
}

/**
 * Initializes closure compiler with the given set of flags. Some notes:
 * 1. We use closure compiler's streaming plugin because invoking a command with
 *    a long list of flags exceeds the command line size limit on Windows.
 * 2. Source files are consumed directly from disk via --js flags, and we pass
 *    an empty stream to the plugin instead of converting them to Vinyl files.
 *    This is why streamMode == IN and requireStreamInput == false.
 * @param {Array<string>} flags
 * @return {!Object}
 */
function initializeClosure(flags) {}

/**
 * Runs closure compiler with the given set of flags. We call end() to signal
 * that the empty input stream has ended, and resume() to begin compilation.
 * @param {string} outputFilename
 * @param {!Object} options
 * @param {Array<string>} flags
 * @param {Array<string>} srcFiles
 * @return {Promise<void>}
 */
function runClosure(outputFilename, options, flags, srcFiles) {
  return new Promise((resolve, reject) => {
    console.log(flags);
    const pluginOptions = {
      streamMode: 'IN',
      requireStreamInput: false,
      logger: logClosureCompilerError,
    };

    gulp
      .src(srcFiles, {base: '.'})
      .pipe(compiler.gulp()(flags, pluginOptions))
      .on('error', (err) => {
        const reason = handleClosureCompilerError(err, outputFilename, options);
        reason ? reject(reason) : resolve();
      })
      .on('end', resolve)
      .end()
      .resume();
  });
}

module.exports = {
  runClosure,
};
