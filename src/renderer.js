let tabs = [];
let currentTabIndex = -1;

document.getElementById("new-tab").addEventListener("click", () => {
  createTab("https://www.google.com", "New Tab");
});

document.getElementById("go").addEventListener("click", () => {
  const query = document.getElementById("url").value;
  if (query) {
    navigateTo(query);
  }
});

document.getElementById("back").addEventListener("click", () => {
  if (currentTabIndex !== -1) {
    const webview = tabs[currentTabIndex].webview;
    webview.goBack();
  }
});

document.getElementById("forward").addEventListener("click", () => {
  if (currentTabIndex !== -1) {
    const webview = tabs[currentTabIndex].webview;
    webview.goForward();
  }
});

window.electronAPI.receive("create-new-tab", (url) => {
  createTab(url, url);
});

window.electronAPI.receive("download-progress", (message) => {
  const loadingNotice = document.getElementById("loading-notice");
  loadingNotice.textContent = message;
  loadingNotice.style.display = "block";
  if (
    message === "Tải xuống hoàn tất" ||
    message.startsWith("Tải xuống bị lỗi")
  ) {
    setTimeout(() => {
      loadingNotice.style.display = "none";
    }, 3000);
  }
});

function createTab(url, title) {
  const tab = document.createElement("div");
  tab.className = "tab";
  tab.innerHTML = `<span class="tab-title">${title}</span> <span class="close-btn">&times;</span>`;

  tab.addEventListener("click", (event) => {
    if (event.target.classList.contains("close-btn")) {
      closeTab(tabs.indexOf(tabData));
    } else {
      switchTab(tabs.indexOf(tabData));
    }
  });

  const webview = document.createElement("webview");
  webview.src = url;
  webview.allowpopups = true;

  webview.addEventListener("did-start-loading", () => {
    document.getElementById("loading-notice").textContent = "Đang tải...";
    document.getElementById("loading-notice").style.display = "block";
  });

  webview.addEventListener("did-stop-loading", () => {
    document.getElementById("loading-notice").style.display = "none";
    const currentUrl = webview.getURL();
    if (currentUrl.startsWith("https://www.google.com/search")) {
      const urlParams = new URLSearchParams(new URL(currentUrl).search);
      const query = urlParams.get("q");
      if (query) {
        tab.querySelector(".tab-title").textContent = query;
      }
    } else {
      tab.querySelector(".tab-title").textContent = currentUrl;
    }
    document.getElementById("url").value = currentUrl;
  });

  const tabData = { tab, webview };
  tabs.push(tabData);

  document.getElementById("tabs").appendChild(tab);
  document.getElementById("webview-container").appendChild(webview);

  switchTab(tabs.length - 1);
}

function switchTab(index) {
  if (currentTabIndex !== -1) {
    tabs[currentTabIndex].tab.classList.remove("active");
    tabs[currentTabIndex].webview.classList.remove("active");
  }

  currentTabIndex = index;
  tabs[currentTabIndex].tab.classList.add("active");
  tabs[currentTabIndex].webview.classList.add("active");
}

function closeTab(index) {
  if (index !== -1) {
    const tabData = tabs[index];
    document.getElementById("tabs").removeChild(tabData.tab);
    document.getElementById("webview-container").removeChild(tabData.webview);

    tabs.splice(index, 1);

    if (currentTabIndex === index) {
      if (tabs.length > 0) {
        currentTabIndex = index === 0 ? 0 : index - 1;
        switchTab(currentTabIndex);
      } else {
        currentTabIndex = -1;
      }
    } else if (currentTabIndex > index) {
      currentTabIndex--;
    }

    if (tabs.length === 0) {
      window.electronAPI.send("check-close-all-tabs");
    }
  }
}

function navigateTo(query) {
  let url;
  if (query.startsWith("http://") || query.startsWith("https://")) {
    url = query;
  } else {
    url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
  if (currentTabIndex !== -1) {
    tabs[currentTabIndex].webview.src = url;
    tabs[currentTabIndex].tab.querySelector(".tab-title").textContent = query;
  }
}

// Mở tab mặc định khi tải trang
createTab("https://www.google.com", "Google");
