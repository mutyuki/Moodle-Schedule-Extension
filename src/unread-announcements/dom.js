(() => {
  function createAnnouncePanel() {
    const panel = document.createElement("div");
    panel.id = "rits-announce-panel";
    panel.innerHTML =
      '<div class="rits-panel-header">' +
      "<h3>未読アナウンス</h3>" +
      '<button class="rits-refresh-btn" id="rits-refresh-btn">更新</button>' +
      "</div>" +
      '<div class="rits-panel-body">' +
      '<div class="rits-loading"><span class="rits-loading-spinner"></span>読み込み中...</div>' +
      "</div>";
    return panel;
  }

  window.RitsUnreadAnnouncementList = window.RitsUnreadAnnouncementList || {};
  window.RitsUnreadAnnouncementList.createAnnouncePanel = createAnnouncePanel;
})();
