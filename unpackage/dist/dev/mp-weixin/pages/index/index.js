"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      loginType: "weixin",
      loginTypeOption: [{
        "value": "weixin",
        "text": "微信"
      }, {
        "value": "univerify",
        "text": "一键登录"
      }, {
        "value": "username",
        "text": "账号密码"
      }, {
        "value": "smsCode",
        "text": "手机验证码"
      }]
    };
  },
  onLoad() {
  },
  methods: {
    toLogin() {
      if (this.loginType == "username") {
        common_vendor.index.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
        });
      } else {
        common_vendor.index.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/login/login-withoutpwd?type=" + this.loginType,
          animationType: "none",
          animationDuration: 0
        });
      }
    },
    toUserInfoPage() {
      common_vendor.index.navigateTo({
        url: "/uni_modules/uni-id-pages/pages/userinfo/userinfo?showLoginManage=true"
      });
    }
  }
};
if (!Array) {
  const _easycom_uni_data_checkbox2 = common_vendor.resolveComponent("uni-data-checkbox");
  const _easycom_uni_forms_item2 = common_vendor.resolveComponent("uni-forms-item");
  (_easycom_uni_data_checkbox2 + _easycom_uni_forms_item2)();
}
const _easycom_uni_data_checkbox = () => "../../uni_modules/uni-data-checkbox/components/uni-data-checkbox/uni-data-checkbox.js";
const _easycom_uni_forms_item = () => "../../uni_modules/uni-forms/components/uni-forms-item/uni-forms-item.js";
if (!Math) {
  (_easycom_uni_data_checkbox + _easycom_uni_forms_item)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o((...args) => $options.toUserInfoPage && $options.toUserInfoPage(...args)),
    b: common_vendor.o(($event) => $data.loginType = $event),
    c: common_vendor.p({
      multiple: false,
      localdata: $data.loginTypeOption,
      mode: "button",
      modelValue: $data.loginType
    }),
    d: common_vendor.p({
      label: "切换登录方式",
      labelWidth: "70"
    }),
    e: common_vendor.o((...args) => $options.toLogin && $options.toLogin(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
