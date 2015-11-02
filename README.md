# brightspot-js-ajax-links

This module/plugin will allow for convertion of plain links or forms to ajaxable content. It can be used for use cases such as search results filtering, or where we might want to make an aside module a little more "dynamic"

## Overview

The HTML has a wrap class to place the content on the page which has the data attr to turn it into the plugin. Inside this div any links or forms that have data-ajax-link-target="selectorHere" will turn into ajaxable content. The plugin will kill the click on that a element (or submit on the form), ajax in it's href (or action + serialized data) and find the "selectorHere" div on the subsequent page. It will then by default, replace the "selectorHere" on the current page with the newly ajaxed div.

## Usage

Create your HTML with the proper data attributes and classes. The default classes are `toggle-item` and `toggle-trigger` and the following markup works well:

	<div class="content-wrap" data-bsp-ajax-links>
		<div class="content">
			<a href="this-page-will-ajax-in.html" data-ajax-link-target=".content">
		</div>
	</div>

IMPORTANT: Your Ajaxed page HAS to have the above example ".content" selector in it. That's how this code knows what to replace and where. It does NOT assume that it's returning the entire Ajax result into the target. It finds the "selectorHere" (.content) on the ajax result and gets it's contents

You have the option to set data-bsp-ajax-links=-options to enable loadType (default: replace, optional: append, loadMore). If append is used, the ajaxed "selectorHere" div will be placed after the original "selectorHere". If loadMore is used, the link that was clicked on will be removed and the ajaxed the div will be placed after the original "selectorHere"

You also have the option to enable history management. This works well for the "replace" loadType as when content gets replaced, we will push URLs into history to maintain state, which will also enable the back button to re-ajax previous content.

## TODO:

Need to add unit testing and live examples into this repo