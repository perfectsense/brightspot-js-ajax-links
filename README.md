# brightspot-js-ajax-links

## Overview

This module/plugin will allow for convertion of plain links or forms to ajaxable content.
This can be used for use cases such as search results filtering, or where we might want to make an aside module a little more "dynamic"

This HTML has a wrap class to place the content on the page which has the data attr to turn it into the plugin
Inside this div any links or forms that have data-ajax-link-target="selectorHere" will turn into ajaxable content.
The plugin will kill the click on that a element (or submit on the form), ajax in it's href (or action + serialized data)
and find the "selectorHere" div on the subsequent page.

IMPORTANT: By default your ajaxed page HAS to have the "selectorHere" on it. That's how this code knows what to replace and where.
It does NOT assume that it's returning the entire Ajax result into the target. It finds the "selectorHere" on the ajax
result and gets it's contents. You can set the "fullPageAjax" to false, which WILL assume that it's returning the entire Ajax
result into target. If that is done, the BE needs to have the logic to only return the contents

There are three loadType modes:
1) replace (default) - This will replace the content of the "selectorHere" with what is Ajaxed in

2) append - This will simply append what is ajaxed here at the end of "selectorHere".
   This is a good mode if you have a infinite load type of experience, but your load more is
   somewhere outside and want to keep using it to add more content

3) loadMore - This is a more where we will append the Ajaxed in items to the end of "selectorHere", but we are assuming that you
   used a "loadMore" type button and the new content ALSO has that button. Therefore, we will delete the previous loadMore button
   This is a good mode if you have load more functionality, but it could end, so you want to bring the next load more button in
   with your ajax content. Once the ajaxed content doesn't have the load more, the user will have reached the end.

You have the option to set data-bsp-ajax-links=-options to enable loadType (default: replace, optional: append, loadMore).
If append is used, the ajaxed "selectorHere" div will be placed after the original "selectorHere"
If loadMore is used, the link that was clicked on will be removed and the ajaxed the div will be placed after the original "selectorHere"

You also have the option to enable history management. This works well for the "replace" loadType as when content gets replaced,
we will push URLs into history to maintain state, which will also enable the back button to re-ajax previous content.

Lastly, we can add some additional params to the ajaxed URL. Let's say you want to add a _context to only get partial HTML or something
similar, you can do that by passing a JSON object to "extraParams" which will get serialized and added to the original link href

## Usage

Example HTML:
	<div class="content-wrap" data-bsp-ajax-links>
	     <div class="content">
	         <a href="this-page-will-ajax-in.html" data-ajax-link-target=".content">
	     </div>
	</div>

## TODO:

Need to add unit testing and live examples into this repo
