"use strict";
const common_vendor = require("../../common/vendor.js");
const uni_modules_uniIdPages_common_store = require("../../uni_modules/uni-id-pages/common/store.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 20,
      menuButtonWidth: 0,
      postId: "",
      post: {
        title: "",
        content: "",
        cover: "",
        images: [],
        user_name: "",
        user_avatar: "",
        created_at: null,
        views: 0,
        likes: 0
      },
      displayImages: [],
      currentImageIndex: 0,
      comments: [],
      scrollTop: 0,
      commentContent: "",
      commentFocus: false,
      sending: false,
      isLiked: false,
      likeLoading: false
    };
  },
  computed: {
    navBackgroundColor() {
      return `rgba(255, 255, 255, ${Math.min(this.scrollTop / 100, 1)})`;
    },
    navTitleOpacity() {
      return Math.min(this.scrollTop / 100, 1);
    },
    isScrolled() {
      return this.scrollTop > 50;
    }
  },
  onLoad(options) {
    if (options.id) {
      this.postId = options.id;
      this.fetchPostDetail();
      this.fetchComments();
      this.checkLikeStatus();
    }
    const systemInfo = common_vendor.index.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 20;
    const menuButtonInfo = common_vendor.index.getMenuButtonBoundingClientRect();
    const screenWidth = systemInfo.screenWidth;
    this.menuButtonWidth = screenWidth - menuButtonInfo.left + 10;
  },
  methods: {
    goBack() {
      common_vendor.index.navigateBack();
    },
    async fetchPostDetail() {
      common_vendor.index.showLoading({ title: "加载中..." });
      const db = common_vendor.tr.database();
      try {
        const res = await db.collection("knitting-posts").doc(this.postId).get();
        if (res.result.data.length > 0) {
          let postData = res.result.data[0];
          let cloudFiles = [];
          const imageList = postData.images || (postData.cover ? [postData.cover] : []);
          imageList.forEach((url) => {
            if (url && url.startsWith("cloud://"))
              cloudFiles.push(url);
          });
          if (postData.user_avatar && postData.user_avatar.startsWith("cloud://")) {
            cloudFiles.push(postData.user_avatar);
          }
          let fileMap = {};
          if (cloudFiles.length > 0) {
            try {
              const tempRes = await common_vendor.tr.getTempFileURL({ fileList: [...new Set(cloudFiles)] });
              tempRes.fileList.forEach((file) => {
                fileMap[file.fileID] = file.tempFileURL;
              });
            } catch (e) {
              common_vendor.index.__f__("error", "at pages/post/detail.vue:214", "Convert images failed", e);
            }
          }
          this.displayImages = imageList.map((url) => fileMap[url] || url);
          postData.cover = this.displayImages[0] || "";
          postData.user_avatar = fileMap[postData.user_avatar] || postData.user_avatar;
          const knittingCo = common_vendor.tr.importObject("knitting-co");
          knittingCo.addViewCount(this.postId).catch((e) => {
            common_vendor.index.__f__("error", "at pages/post/detail.vue:225", "Update view count failed", e);
          });
          this.post = postData;
        } else {
          common_vendor.index.showToast({ title: "作品不存在", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/post/detail.vue:233", "Fetch post detail failed", e);
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    async fetchComments() {
      const db = common_vendor.tr.database();
      try {
        const res = await db.collection("knitting-comments").where({ post_id: this.postId }).orderBy("created_at", "desc").get();
        let comments = res.result.data;
        const fileList = comments.filter((item) => item.user_avatar && item.user_avatar.startsWith("cloud://")).map((item) => item.user_avatar);
        if (fileList.length > 0) {
          try {
            const tempFilesRes = await common_vendor.tr.getTempFileURL({ fileList });
            const fileMap = {};
            tempFilesRes.fileList.forEach((file) => {
              fileMap[file.fileID] = file.tempFileURL;
            });
            comments = comments.map((item) => ({
              ...item,
              user_avatar: fileMap[item.user_avatar] || item.user_avatar
            }));
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/post/detail.vue:266", "Convert comment avatars failed", e);
          }
        }
        this.comments = comments;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/post/detail.vue:272", "Fetch comments failed", e);
      }
    },
    toggleCommentInput() {
      this.$refs.commentPopup.open();
      setTimeout(() => {
        this.commentFocus = true;
      }, 100);
    },
    closeCommentPopup() {
      this.$refs.commentPopup.close();
      this.commentFocus = false;
    },
    async handleSendComment() {
      var _a, _b;
      if (!this.commentContent.trim())
        return;
      this.sending = true;
      const db = common_vendor.tr.database();
      const userInfo = common_vendor.tr.getCurrentUserInfo();
      let userDetail = uni_modules_uniIdPages_common_store.store.userInfo;
      if (!userDetail.nickname) {
        try {
          await uni_modules_uniIdPages_common_store.mutations.updateUserInfo();
          userDetail = uni_modules_uniIdPages_common_store.store.userInfo;
        } catch (e) {
        }
      }
      const commentData = {
        post_id: this.postId,
        user_id: userInfo.uid,
        user_name: userDetail.nickname || "织友",
        user_avatar: ((_a = userDetail.avatar_file) == null ? void 0 : _a.url) || "",
        content: this.commentContent.trim()
      };
      try {
        await db.collection("knitting-comments").add(commentData);
        const activityData = {
          user_id: userInfo.uid,
          type: "comment",
          content: this.commentContent.trim(),
          target_id: this.postId,
          target_title: this.post.title,
          from_user_name: userDetail.nickname || "织友",
          from_user_avatar: ((_b = userDetail.avatar_file) == null ? void 0 : _b.url) || ""
        };
        await db.collection("knitting-activities").add(activityData);
        common_vendor.index.$emit("refreshDiscover");
        common_vendor.index.showToast({ title: "评论成功" });
        this.commentContent = "";
        this.closeCommentPopup();
        this.fetchComments();
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/post/detail.vue:333", "Send comment failed", e);
        common_vendor.index.showToast({ title: "评论失败", icon: "none" });
      } finally {
        this.sending = false;
      }
    },
    onScroll(e) {
      this.scrollTop = e.detail.scrollTop;
    },
    onSwiperChange(e) {
      this.currentImageIndex = e.detail.current;
    },
    previewImage(index) {
      if (this.displayImages.length > 0) {
        common_vendor.index.previewImage({
          urls: this.displayImages,
          current: this.displayImages[index || 0]
        });
      }
    },
    async checkLikeStatus() {
      try {
        const userInfo = common_vendor.tr.getCurrentUserInfo();
        if (!userInfo.uid)
          return;
        const knittingCo = common_vendor.tr.importObject("knitting-co");
        const res = await knittingCo.checkLiked(this.postId, userInfo.uid);
        if (res.errCode === 0) {
          this.isLiked = res.liked;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/post/detail.vue:363", "Check like status failed", e);
      }
    },
    async handleToggleLike() {
      if (this.likeLoading)
        return;
      const userInfo = common_vendor.tr.getCurrentUserInfo();
      if (!userInfo.uid) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        return;
      }
      this.likeLoading = true;
      try {
        const knittingCo = common_vendor.tr.importObject("knitting-co");
        const res = await knittingCo.toggleLike(this.postId, userInfo.uid);
        if (res.errCode === 0) {
          this.isLiked = res.liked;
          this.post.likes = (this.post.likes || 0) + (res.liked ? 1 : -1);
          if (this.post.likes < 0)
            this.post.likes = 0;
        } else {
          common_vendor.index.showToast({ title: res.errMsg || "操作失败", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/post/detail.vue:389", "Toggle like failed", e);
        common_vendor.index.showToast({ title: "操作失败", icon: "none" });
      } finally {
        this.likeLoading = false;
      }
    },
    formatTime(timestamp) {
      if (!timestamp)
        return "";
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_popup2 = common_vendor.resolveComponent("uni-popup");
  (_easycom_uni_icons2 + _easycom_uni_popup2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_popup = () => "../../uni_modules/uni-popup/components/uni-popup/uni-popup.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_popup)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.p({
      type: "back",
      size: "20",
      color: $options.isScrolled ? "#333" : "#fff"
    }),
    c: $options.isScrolled ? 1 : "",
    d: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    e: $options.navTitleOpacity,
    f: ($data.menuButtonWidth || 80) + "px",
    g: $options.navBackgroundColor,
    h: common_vendor.f($data.displayImages, (img, index, i0) => {
      return {
        a: img,
        b: index,
        c: common_vendor.o(($event) => $options.previewImage(index), index)
      };
    }),
    i: $data.displayImages.length > 1,
    j: common_vendor.o((...args) => $options.onSwiperChange && $options.onSwiperChange(...args)),
    k: $data.displayImages.length > 1
  }, $data.displayImages.length > 1 ? {
    l: common_vendor.t($data.currentImageIndex + 1),
    m: common_vendor.t($data.displayImages.length)
  } : {}, {
    n: common_vendor.t($data.post.title),
    o: $data.post.user_avatar || "/static/logo.png",
    p: common_vendor.t($data.post.user_name || "织友"),
    q: common_vendor.t($options.formatTime($data.post.created_at)),
    r: common_vendor.t($data.post.content),
    s: common_vendor.p({
      type: "eye",
      size: "16",
      color: "#999"
    }),
    t: common_vendor.t($data.post.views || 0),
    v: common_vendor.p({
      type: "heart",
      size: "16",
      color: "#999"
    }),
    w: common_vendor.t($data.post.likes || 0),
    x: common_vendor.t($data.comments.length),
    y: $data.comments.length > 0
  }, $data.comments.length > 0 ? {
    z: common_vendor.f($data.comments, (item, k0, i0) => {
      return {
        a: item.user_avatar || "/static/logo.png",
        b: common_vendor.t(item.user_name),
        c: common_vendor.t($options.formatTime(item.created_at)),
        d: common_vendor.t(item.content),
        e: item._id
      };
    })
  } : {}, {
    A: common_vendor.o((...args) => $options.onScroll && $options.onScroll(...args)),
    B: common_vendor.p({
      type: "chat",
      size: "20",
      color: "#666"
    }),
    C: common_vendor.o((...args) => $options.toggleCommentInput && $options.toggleCommentInput(...args)),
    D: common_vendor.p({
      type: $data.isLiked ? "heart-filled" : "heart",
      size: "24",
      color: $data.isLiked ? "#FF6B6B" : "#333"
    }),
    E: common_vendor.t($data.post.likes || 0),
    F: $data.isLiked ? "#FF6B6B" : "#333",
    G: common_vendor.o((...args) => $options.handleToggleLike && $options.handleToggleLike(...args)),
    H: common_vendor.o($options.closeCommentPopup),
    I: common_vendor.p({
      type: "closeempty",
      size: "24",
      color: "#999"
    }),
    J: $data.commentFocus,
    K: $data.commentContent,
    L: common_vendor.o(($event) => $data.commentContent = $event.detail.value),
    M: common_vendor.t($data.sending ? "发送中..." : "发送"),
    N: !$data.commentContent.trim() || $data.sending,
    O: common_vendor.o((...args) => $options.handleSendComment && $options.handleSendComment(...args)),
    P: common_vendor.sr("commentPopup", "b14daf57-5"),
    Q: common_vendor.p({
      type: "bottom",
      ["background-color"]: "#fff"
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b14daf57"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/post/detail.js.map
