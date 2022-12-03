function AddDownloadButton(btn, absolute) {

	if (!btn || !btn.classList.contains("button-buy")) {return}

	// DLC check
	if (btn.href.includes("dlc_id=")) {return}

	let modItem = btn.parentElement
	let dlIconURL = chrome.runtime.getURL("assets/icon-download.svg")
	let loaderURL = chrome.runtime.getURL("assets/loader.svg")

	// Make original button smaller
	btn.style.maxWidth = "calc(100% - 45px)"
	btn.style.marginRight = "0px"

	// Create a div and move the original button into it
	let div = document.createElement("div")
	div.style.width = "100%"
	div.style.height = "45px"
	div.style.display = "flex"
	div.style.flexDirection = "row"
	if (absolute) {
		div.style.position = "absolute"
		div.style.bottom = "0px"
		div.style.right = "0px"
	}
	btn.parentNode.insertBefore(div, btn.nextSibling)
	div.appendChild(btn)

	// New download button inside the div
	let dlButton = document.createElement("div")
	dlButton.classList.add("button-directdl")
	if (absolute) {
		dlButton.classList.add("button-directdl-absolute")
	}
	dlButton.addEventListener("click", async () => {
		if (dlButton.Working) {return}

		dlButton.Working = true
		dlButton.querySelector("img").src = loaderURL

		await DownloadMod(modItem, btn.href)

		dlButton.querySelector("img").src = dlIconURL
		dlButton.Working = false
	})
	div.appendChild(dlButton)

	// Download icon
	let dlIcon = document.createElement("img")
	dlIcon.src = dlIconURL
	dlButton.appendChild(dlIcon)

}

async function GetDependencies(modPageDom) {
	
	let deps = []

	let depsDivHeadline = modPageDom.getElementsByClassName("title-mods-label")
	if (!depsDivHeadline || depsDivHeadline.length === 0) { // = no dependencies
		return []
	}

	let depsDiv = depsDivHeadline[0].parentElement
	let depsLinkTags = depsDiv.querySelectorAll("a")
	for (let elem of depsLinkTags) {
		if (elem.target === "_blank") {continue} // Logo of the creator
		let href = elem.href
		deps.push(href)
	}

	return deps

}

async function DownloadURL(url) {

	let a = document.createElement("a")
	a.href = url
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	delete a

}

async function DownloadMod(modItem, modURL) {

	let modPageRes = await fetch(modURL)
	let modPageText = await modPageRes.text()
	let modPageDom = new DOMParser().parseFromString(modPageText, "text/html")
	if (!modPageDom) {return}

	// Get download link
	let downloadBox = modPageDom.getElementsByClassName("download-box")[0]
	if (!downloadBox) {return}

	let downloadURL = downloadBox.querySelector("a").href
	if (!downloadURL) {return}

	// Download mod
	DownloadURL(downloadURL)

	// Check dependencies
	let dependencies = await GetDependencies(modPageDom)
	if (dependencies && dependencies.length > 0) {
		let modName = (modItem.querySelector("h4") || modItem.querySelector("h3")).innerText
		if (confirm(chrome.i18n.getMessage("dependenciesConfirmation", [modName, dependencies.length]))) {
			for (let dep of dependencies) {
				await new Promise(resolve => setTimeout(resolve, 1500))
				DownloadURL(dep)
			}
		}
	}

}

// Main mods list
let modItemsBtns = document.querySelectorAll(".mod-item > a")
for (let btn of modItemsBtns) {
	AddDownloadButton(btn)
}

// Two recommended mods above the main mods list
let recommendedModsBtns = document.querySelectorAll(".machines__overview a")
for (let btn of recommendedModsBtns) {
	AddDownloadButton(btn, true)
}

// One featured mod at the very top
let featuredModsBtns = document.querySelectorAll(".dlc-featured__info a")
for (let btn of featuredModsBtns) {
	AddDownloadButton(btn, true)
}