let tabs = [];
let currentTabIndex = -1;

document.getElementById("new-tab").addEventListener("click", () => {
  createTab("https://www.google.com", "New Tab");
});

document.getElementById("url").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const query = event.target.value;
    if (query) {
      navigateTo(query);
    }
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

document.getElementById("reload").addEventListener("click", () => {
  if (currentTabIndex !== -1) {
    const webview = tabs[currentTabIndex].webview;
    webview.reload();
    showLoadingBar();
  }
});

window.electronAPI.receive("create-new-tab", (url) => {
  createTab(url, url);
});

window.electronAPI.receive("download-progress", (message) => {
  const downloadProgress = document.getElementById("download-progress");
  const downloadProgressBar = document.getElementById("download-progress-bar");
  const downloadProgressText = document.getElementById("download-progress-text");

  if (message.startsWith("Đang tải xuống: ")) {
    const progress = parseInt(message.replace("Đang tải xuống: ", "").replace("%", ""));
    downloadProgressBar.style.width = `${progress}%`;
    downloadProgressText.textContent = `Đang tải xuống ${progress}%`;
    downloadProgress.style.display = "block";
  } else {
    downloadProgressText.textContent = message;
    if (message === "Tải xuống hoàn tất" || message.startsWith("Tải xuống bị lỗi")) {
      setTimeout(() => {
        downloadProgress.style.display = "none";
        downloadProgressBar.style.width = "0";
        downloadProgressText.textContent = "";
      }, 3000);
    }
  }
});

function showLoadingBar() {
  const loadingBar = document.getElementById("loading-bar");
  loadingBar.style.width = "0%";
  let width = 0;

  const interval = setInterval(() => {
    if (width >= 100) {
      clearInterval(interval);
    } else {
      width++;
      loadingBar.style.width = width + "%";
    }
  }, 50);
}

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
    showLoadingBar();
  });

  webview.addEventListener("did-stop-loading", () => {
    const currentUrl = webview.getURL();
    tab.querySelector(".tab-title").textContent = currentUrl;
    document.getElementById("url").value = currentUrl;

    // Cuộn lên đầu trang
    webview.executeJavaScript('window.scrollTo(0, 0)');
  });

  const tabData = { tab, webview };
  tabs.push(tabData);

  document.getElementById("tabs").appendChild(tab);
  document.getElementById("webview-container").appendChild(webview);
  document.getElementById("webview-container").style.display = "block";
  document.getElementById("no-tabs-message").classList.add("hidden");

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
      document.getElementById("webview-container").style.display = "none";
      document.getElementById("no-tabs-message").classList.remove("hidden");
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

// // Mở tab mặc định khi tải trang
// createTab("https://www.google.com", "Google");
