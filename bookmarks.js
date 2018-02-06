const FOLDER_CLASS = 'bookmarkFolder';
const TITLE_CLASS = 'bookmarkFolderTitle';
const CONTENT_CLASS = 'bookmarkFolderContent';
const CONTENT_PREFIX = 'contentOf_';
const LINK_CONTAINER_CLASS = 'bookmarkLinkContainer';
const BOOKMARK_CLASS = 'bookmarkLink';
const SWAP_CONTAINER = 'swapContainer';
const RESULT = 'result';
const FOLDER_RESULT = 'folderResult';
const FOLDER = 'folder';
const HEADING = 'heading';
const EXPANDED = 'expanded';
const COLLAPSED = 'collapsed';
const SEARCHING_STATE = 'searching';
const BOOKMARK_DIV = '#bookmarks';
const RESULT_DIV = '#filterBookmarks';
const ROOT_NODE = 'root________';
/*
how to JS!?!?
 */

const bookmarkDisp = {
	bookmarkParents: null,
	/**
	 * Create an object mapping each bookmark's internal ID to its title + its
	 * parent's ID
	 *
	 * @param  {BookmarkTreeNode} bookmarkTreeNode - a bookmarkTreeNode returned by the bookmark API
	 * @return {object}
	 */
	async mapBookmarkParents(bookmarkTreeNode) {
		let bookmarkParentIds = {};
		let nodeStack = [];
		nodeStack.push(bookmarkTreeNode);
		let currentNode;
		while (nodeStack.length) {
			currentNode = nodeStack.pop();
			if (currentNode.children) {
				bookmarkParentIds[currentNode.id] = {
					title: currentNode.title,
					parentId: currentNode.parentId
				};
				for (child of currentNode.children) {
					if (child.children) {
						nodeStack.push(child);
					}
				}
			}
		}
		return bookmarkParentIds;
	},

	/**
	 * Given an initial bookmarkTreeNode, render child folders and bookmarks by appending to
	 * provided element.
	 *
	 * @param  {BookmarkTreeNode} bookmarkTreeNode - root node
	 * @param  {HTMLElement} appendee - element to append to
	 * @param  {String} prefix - optional prefix for IDs assigned
	 * @param  {Boolean} isResults - true if working with search results
	 *
	 * @return {HTMLElement} - provided element `appendee` with everything appended
	 */
	async renderBookmarks(bookmarkTreeNode, appendee, prefix = '', isResults = false) {
		//let ignoreIds = ['E5Xy69jI8-V2', 'FFThanxl5vaG', 'mobile______'];
		let ignoreIds = [''];
		let ignoreTitles = ['Recent Tags'];
		let stickyIds = ['toolbar_____'];
		let expandedIds = ['toolbar_____'];
		if (!bookmarkTreeNode.children) {
			return;
		}
		let node;
		let prepend;
		let expanded;
		for (child of bookmarkTreeNode.children) {
			if (ignoreIds.includes(child.id) || child.type === 'separator'
			    || ignoreTitles.includes(child.title)) {
				continue;
			}
			prepend = stickyIds.includes(child.id);
			expanded = expandedIds.includes(child.id);
			/**
			 * Structure of each folder displayed:
			 *     .bookmarkFolder
			 *         .bookmarkFolderTitle
			 *             .icon
			 *             title
			 *         .bookmarkFolderContent
			 *             .bookmarkLinkContainer
			 *                 .bookmarkLink
			 *             .bookmarkLinkContainer
			 *             [...]
			 */
			if (child.url) {
				// Create div to hold bookmark url
				node = document.createElement('div');
				node.setAttribute('class', LINK_CONTAINER_CLASS);
				// url <a> node
				let anode = document.createElement('a');
				anode.setAttribute('href', child.url);
				anode.setAttribute('class', BOOKMARK_CLASS);
				// url text
				let textNode = document.createTextNode(child.title);
				anode.appendChild(textNode);
				// append to url div
				node.appendChild(anode);
			} else if (child.type === FOLDER) {
				// Create outer div to hold bookmark title div + content div
				node = document.createElement('div');
				node.setAttribute('class', FOLDER_CLASS);
				// title div
				let titleNode = document.createElement('div');
				let designation = (isResults) ?
					(child.subtype === FOLDER) ?
						' ' + FOLDER_RESULT :
						' ' + RESULT :
					'';
				let collapsed = ((isResults && child.subtype === HEADING) || expanded) ? ' ' + EXPANDED : '';
				titleNode.setAttribute('class', TITLE_CLASS + designation + collapsed);
				titleNode.setAttribute('id', prefix + child.id);
				titleNode.addEventListener('click', bookmarkDisp.toggleHandler);
				// div for positioning the header icons
				let iconNode = document.createElement('div');
				iconNode.setAttribute('class', 'icon');
				titleNode.appendChild(iconNode);
				// title text
				let textNode = document.createTextNode(child.title);
				titleNode.appendChild(textNode);
				// append title div to outer div
				node.appendChild(titleNode);
				// content div
				let contentNode = document.createElement('div');
				collapsed = ((isResults && child.subtype === HEADING) || expanded) ? '' : ' ' + COLLAPSED;
				contentNode.setAttribute('class', CONTENT_CLASS + collapsed);
				contentNode.setAttribute('id', CONTENT_PREFIX + prefix + child.id);
				// append content div to outer div
				node.appendChild(contentNode);
				// pass content div as parent div for rendering children of current node
				bookmarkDisp.renderBookmarks(child, contentNode, prefix);
			}
			// append current node (folder or bookmark) to parent
			(prepend) ? appendee.prepend(node) : appendee.appendChild(node);
		}
		return appendee;
	},

	/**
	 * Helper method to sort and display search results
	 *
	 * @param  {[BookmarkTreeNode]} results - result list returns by bookmark api search
	 *
	 * @return {void}
	 */
	async renderFilteredBookmarks(results) {
		if (!results) {
			return;
		};
		let categorizedResults = await bookmarkDisp.categorizeFilteredBookmarks(results);
		let orderedResults = await bookmarkDisp.processFilteredBookmarks(categorizedResults);
		let polyResults = await bookmarkDisp.convertToPseudoBookmarkNode(categorizedResults, orderedResults);
		let appendee = document.querySelector(RESULT_DIV);
		let appendeeFragment = document.createDocumentFragment();
		await bookmarkDisp.renderBookmarks(polyResults, appendeeFragment, 'result_', true);
		appendee.appendChild(appendeeFragment);
		return;
	},

	/**
	 * Restructure categorized and ordered results into an object structure
	 * usable with renderBookmarks().
	 *
	 * @param  {Object} categorizedResults - categorized results from categorizeFilteredBookmarks()
	 * @param  {[Object]} orderedResults - list of result objects from processFilteredBookmarks()
	 *
	 * @return {Object}
	 */
	async convertToPseudoBookmarkNode(categorizedResults, orderedResults) {
		let pseudoNode = {children: []};
		let childNode;
		for (result of orderedResults) {
			let isFolder = result.type === FOLDER;
			childNode = {
				type: FOLDER,
				subtype: result.type,
				title: result.nodePath,
				id: (isFolder) ? FOLDER + result.id : HEADING + result.id,
				children: null
			};
			if (isFolder) {
				let folderChildren = await browser.bookmarks.getSubTree(result.id);
				childNode.children = folderChildren[0].children;
			} else {
				childNode.children = categorizedResults[result.id];
			}
			pseudoNode.children.push(childNode);
		}
		return pseudoNode;
	},

	/**
	 * Using parent map, create a string indicating path to bookmark root.
	 *
	 * @param  {String} nodeId - ID of a BookmarkTreeNode
	 *
	 * @return {String} - Path to root
	 */
	async generateNodePath(nodeId) {
		let nodePath;
		let currNode;
		let nextNode;
		try {
			nodePath = bookmarkDisp.bookmarkParents[nodeId].title;
			currNode = nodeId;
			while ((nextNode = bookmarkDisp.bookmarkParents[currNode].parentId) !== ROOT_NODE) {
				nodePath = bookmarkDisp.bookmarkParents[nextNode].title + ' » ' + nodePath;
				currNode = nextNode;
			}
			return nodePath;
		} catch (err) {
			err.message += "\n\tnodeid: " + nodeId + "\n\tnodePath: " + nodePath;
			console.error(err);
			return null;
		}
	},

	/**
	 * Given output of categorizeFilteredBookmarks(), return array of IDs associated with and sorted
	 * alphabetically by their path
	 *
	 * @param  {Object} results - categorized results from categorizeFilteredBookmarks()
	 *
	 * @return {[Object]} - Array of ID Objects sorted by path
	 */
	async processFilteredBookmarks(results) {
		let collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
		let resultKeys = Object.keys(results).filter(e => e !== FOLDER);
		resultKeys = resultKeys.map(e => ({type: HEADING, id: e}));
		resultKeys = resultKeys.concat(results.folder.map(e => ({type: FOLDER, id: e})));
		for (result of resultKeys) {
			let nodePath = await bookmarkDisp.generateNodePath(result.id);
			if (nodePath === null) {
				continue;
			}
			result.nodePath = nodePath;
		}
		let sortedPathIds = resultKeys.sort((a,b) => collator.compare(a.nodePath,b.nodePath));
		return sortedPathIds;
	},

	/**
	 * Given a list of BookmarkTreeNodes returned from bookmark API search, categorize by parent ID
	 *
	 * @param  {[BookmarkTreeNode]} results - Array of nodes returned from bookmarks.search()
	 *
	 * @return {Object} - Object mapping parent IDs to search results
	 */
	async categorizeFilteredBookmarks(results) {
		let categorized = {folder: []};
		return results.reduce((acc,cur) => {
			if (cur.url && cur.url.startsWith('place:')) {
				return acc;
			} else if (cur.type === FOLDER) {
				acc.folder.push(cur.id);
				return acc;
			}
			if (!acc[cur.parentId]) {
				acc[cur.parentId] = [];
			}
			acc[cur.parentId].push(cur);
			return acc;
		}, categorized);
	},

	/**
	 * Click handler for expanding/collapsing bookmarks by folder
	 *
	 * @param  {event} e - click event
	 *
	 * @return {void}
	 */
	async toggleHandler(e) {
		let contents = document.querySelector('#' + CONTENT_PREFIX + e.target.id);
		if (e.target.classList.contains(EXPANDED)) {
			e.target.classList.remove(EXPANDED);
			contents.classList.add(COLLAPSED);
		} else {
			e.target.classList.add(EXPANDED);
			contents.classList.remove(COLLAPSED);
		}
	},

	timeout: null,
	/**
	 * Input handler for search bar. Triggers search event after a short delay.
	 *
	 * @param  {event} e - input event
	 * @return {void}
	 */
	async searchHandler(e) {
		clearTimeout(bookmarkDisp.timeout);
		bookmarkDisp.timeout = setTimeout(() => bookmarkDisp.searchFor(e.target.value), 300);
		return;
	},

	/**
	 * General search handling method. Clears old results, swaps out main bookmark div for result
	 * div, and then executes a search.
	 *
	 * @param  {String} query - search query
	 *
	 * @return {void}
	 */
	async searchFor(query) {
		let bookmarkDivs = document.querySelectorAll('.' + SWAP_CONTAINER);
		let removeResults = document.querySelectorAll(RESULT_DIV + '> .' + FOLDER_CLASS);
		removeResults.forEach(e => {
			e.remove();
		});
		if (!query) {
			bookmarkDivs.forEach(e => {
				e.classList.remove(SEARCHING_STATE);
			});
			return;
		}
		bookmarkDivs.forEach(e => {
			e.classList.add(SEARCHING_STATE);
		});
		let search = await browser.bookmarks.search(query);
		bookmarkDisp.renderFilteredBookmarks(search);
	},

	/**
	 * Called on page load to display user bookmarks
	 *
	 * @return {void}
	 */
	async spawnBookmarks() {
		try {
			let bookmarks = await bookmarkDisp.fetchBookmarks();
			bookmarks = bookmarks[0];
			let bp = await bookmarkDisp.mapBookmarkParents(bookmarks);
			bookmarkDisp.bookmarkParents = bp;
			let bookmarksDiv = document.querySelector(BOOKMARK_DIV);
			let appendeeFragment = document.createDocumentFragment();
			bookmarkDisp.renderBookmarks(bookmarks, appendeeFragment);
			bookmarksDiv.appendChild(appendeeFragment);
		} catch (err) {
			console.error(err);
		}
	},

	/**
	 * Wrapper for bookmark API method to fetch all user bookmarks
	 *
	 * @return {BookmarkTreeNode} - root node of all user bookmarks
	 */
	async fetchBookmarks() {
		return browser.bookmarks.getTree();
	}
};

document.addEventListener('DOMContentLoaded', bookmarkDisp.spawnBookmarks);
document.querySelector('#bookmarkSearch').addEventListener('input', bookmarkDisp.searchHandler);
