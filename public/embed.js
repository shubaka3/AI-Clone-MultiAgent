;(() => {
  // Parse URL parameters from script src
  const scripts = document.getElementsByTagName("script")
  let currentScript = null
  let scriptParams = {}

  // Find the current script and extract parameters
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i]
    if (script.src && script.src.includes("embed.js")) {
      currentScript = script
      const url = new URL(script.src)
      scriptParams = {
        ai_id: url.searchParams.get("ai_id"),
        collection_id: url.searchParams.get("collection_id"),
        user_id: url.searchParams.get("user_id"),
      }
      break
    }
  }

  // Validate required parameters
  if (!scriptParams.ai_id || !scriptParams.collection_id || !scriptParams.user_id) {
    console.error("Missing required parameters: ai_id, collection_id, user_id")
    console.log("Current parameters:", scriptParams)
    return
  }

  console.log("Chat widget initializing with parameters:", scriptParams)

  // Load config if available
  const config = window.APP_CONFIG || {
    CHAT_IFRAME_URL: "/chat-widget.html",
    PRIMARY_COLOR: "#3b82f6",
  }

  // Create chat button
  const chatButton = document.createElement("div")
  chatButton.id = "aiChatButton"
  chatButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: ${config.PRIMARY_COLOR};
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 0.3s ease;
        overflow: hidden;
    `

  // Chat icon
  const chatIcon = document.createElement("div")
  chatIcon.innerHTML = "💬"
  chatIcon.style.cssText = `
        font-size: 24px;
        transition: transform 0.3s ease;
    `
  chatButton.appendChild(chatIcon)

  // Hover effect
  chatButton.onmouseenter = function () {
    this.style.transform = "scale(1.1)"
    this.style.boxShadow = "0 6px 16px rgba(0,0,0,0.4)"
  }

  chatButton.onmouseleave = function () {
    this.style.transform = "scale(1)"
    this.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)"
  }

  document.body.appendChild(chatButton)

  // Create iframe for chat widget
  const chatIframe = document.createElement("iframe")
  chatIframe.id = "aiChatIframe"
  chatIframe.src = `${config.CHAT_IFRAME_URL}?ai_id=${scriptParams.ai_id}&collection_id=${scriptParams.collection_id}&user_id=${scriptParams.user_id}`
  chatIframe.style.cssText = `
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 350px;
        height: 500px;
        border: none;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        z-index: 9999;
        display: none;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
    `

  document.body.appendChild(chatIframe)

  // Toggle chat widget
  let isOpen = false
  chatButton.onclick = (event) => {
    event.stopPropagation()

    if (!isOpen) {
      chatIframe.style.display = "block"
      setTimeout(() => {
        chatIframe.style.opacity = "1"
        chatIframe.style.transform = "translateY(0)"
      }, 10)

      chatIcon.innerHTML = "✕"
      isOpen = true
    } else {
      chatIframe.style.opacity = "0"
      chatIframe.style.transform = "translateY(20px)"

      setTimeout(() => {
        chatIframe.style.display = "none"
      }, 300)

      chatIcon.innerHTML = "💬"
      isOpen = false
    }
  }

  // Close when clicking outside
  document.addEventListener("click", (event) => {
    if (isOpen && !chatIframe.contains(event.target) && !chatButton.contains(event.target)) {
      chatButton.click()
    }
  })

  // Responsive design
  function adjustForMobile() {
    if (window.innerWidth <= 768) {
      chatIframe.style.width = "calc(100vw - 40px)"
      chatIframe.style.height = "calc(100vh - 140px)"
      chatIframe.style.right = "20px"
      chatIframe.style.left = "20px"
    } else {
      chatIframe.style.width = "350px"
      chatIframe.style.height = "500px"
      chatIframe.style.right = "20px"
      chatIframe.style.left = "auto"
    }
  }

  window.addEventListener("resize", adjustForMobile)
  adjustForMobile()

  console.log("Chat widget loaded successfully with params:", scriptParams)
})()
