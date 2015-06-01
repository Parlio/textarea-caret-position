/* jshint browser: true */

(function () {

// The properties that we copy into a mirrored div.
// Note that some browsers, such as Firefox,
// do not concatenate properties, i.e. padding-top, bottom etc. -> padding,
// so we have to do every single property specifically.
var properties = [
  'direction',  // RTL support
  'boxSizing',
  'width',  // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
  'height',
  'overflowX',
  'overflowY',  // copy the scrollbar for IE

  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',

  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',

  // https://developer.mozilla.org/en-US/docs/Web/CSS/font
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',

  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',  // might not make a difference, but better be safe

  'letterSpacing',
  'wordSpacing',

  'tabSize',
  'MozTabSize'

];

var isFirefox = window.mozInnerScreenX != null;

/*
 * We changed this function a little:
 * Case 1: Not sending position
 *     In case we are not sending the caret position in the text area, then we will return the
       coordinates as if the caret is at the last character in the textarea

 * Case 2: Sending a position ( either the position of the caret or anywhere we choose )
 *     We will return the exact coordinates as if the caret is at the position sent
 */
function getCaretCoordinates(element, position) {
  // mirrored div
  var div = document.createElement('div');
  div.id = 'input-textarea-caret-position-mirror-div';
  document.body.appendChild(div);

  var style = div.style;
  // currentStyle for IE < 9
  var computed = window.getComputedStyle? getComputedStyle(element) : element.currentStyle;


  // default textarea styles
  style.whiteSpace = 'pre-wrap';
  if (element.nodeName !== 'INPUT')
    style.wordWrap = 'break-word';  // only for textarea-s

  // position off-screen
  style.position = 'absolute';  // required to return coordinates properly
  style.visibility = 'hidden';  // not 'display: none' because we want rendering

  // transfer the element's properties to the div
  properties.forEach(function (prop) {
    style[prop] = computed[prop];
  });

  if (isFirefox) {
    // Firefox lies about the overflow property for textareas: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
    if (element.scrollHeight > parseInt(computed.height))
      style.overflowY = 'scroll';
  } else {
    style.overflow = 'hidden';  // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
  }

  var span = document.createElement('span');

  if( position != null ) {
    div.textContent = element.value.substring(0, position);
    span.textContent = element.value.substring(position) || ' ';
    // ' ' because a completely empty faux span doesn't render at all
  } else {
    div.textContent = element.value;
    span.textContent = ' ';
  }

  // the second special handling for input type="text" vs textarea: 
  // spaces need to be replaced with non-breaking spaces - http://stackoverflow.com/a/13402035/1269037
  if (element.nodeName === 'INPUT')
    div.textContent = div.textContent.replace(/\s/g, "\u00a0");

  div.appendChild(span);

  if( position != null ) {
    var coordinates = {
      top: span.offsetTop + parseInt(computed['borderTopWidth']),
      left: span.offsetLeft + parseInt(computed['borderLeftWidth'])
    }
    document.body.removeChild(div);
    return coordinates;
  }

  var maxTop = element.scrollHeight
               - parseInt(computed['borderBottomWidth'])
               - parseInt(computed['lineHeight'])
               + parseInt(computed['paddingTop']);

  if( element.scrollTop > 0 ) {
    maxTop = maxTop
             - element.scrollTop
             - parseInt(computed['lineHeight'])
             + parseInt(computed['paddingTop']);

    if( isFirefox )
      maxTop += 4; //Firefox has an odd caclulation of scroll top that is off by ~4px;
  }


  var actualTop = span.offsetTop + parseInt(computed['borderTopWidth']);

  var top = actualTop > maxTop ? maxTop : actualTop;

  var left = span.offsetLeft + parseInt(computed['borderLeftWidth']);

  // If the left position was too far to the right ( the max right - 20 ), then we will return it
  // off to the left by 30px so that the word count div do not get cut to the right of the screen
  // check it on /compose.
  if( left > element.clientWidth - parseInt(computed['paddingLeft']) - parseInt(computed['paddingRight']) - 20 )
    left -= 30;

  var coordinates = {
    top: top,
    left: left
  };

  document.body.removeChild(div);

  return coordinates;
}

if (typeof module != "undefined" && typeof module.exports != "undefined") {
  module.exports = getCaretCoordinates;
} else {
  window.getCaretCoordinates = getCaretCoordinates;
}

}());