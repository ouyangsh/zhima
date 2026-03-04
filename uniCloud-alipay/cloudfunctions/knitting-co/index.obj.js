// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
const db = uniCloud.database();

module.exports = {
    _before: function () {
        // 无需在此处验证身份
    },
    /**
     * 获取指定用户发布的帖子
     * @param {String} uid 用户ID
     * @param {Number} page 页码（从0开始）
     * @param {Number} pageSize 每页大小
     */
    async getMyPosts(uid, page = 0, pageSize = 10) {
        if (!uid) {
            return { errCode: 'PARAM_IS_NULL', errMsg: '缺少用户ID' }
        }
        try {
            const res = await db.collection('knitting-posts')
                .where({ user_id: uid })
                .orderBy('created_at', 'desc')
                .skip(page * pageSize)
                .limit(pageSize)
                .get();
            return { errCode: 0, data: res.data, uid: uid }
        } catch (e) {
            return { errCode: 'QUERY_FAILED', errMsg: e.message }
        }
    },
    /**
     * 获取指定用户的统计数据
     * @param {String} uid 用户ID
     */
    async getMyStats(uid) {
        if (!uid) {
            return { errCode: 'PARAM_IS_NULL', errMsg: '缺少用户ID' }
        }
        try {
            const [postsRes, projectsRes, yarnsRes] = await Promise.all([
                db.collection('knitting-posts').where({ user_id: uid }).count(),
                db.collection('knitting-projects').where({ user_id: uid }).count(),
                db.collection('knitting-yarns').where({ user_id: uid }).count()
            ]);
            return {
                errCode: 0,
                stats: {
                    posts: postsRes.total || 0,
                    projects: projectsRes.total || 0,
                    yarns: yarnsRes.total || 0
                },
                uid: uid
            }
        } catch (e) {
            return { errCode: 'QUERY_FAILED', errMsg: e.message }
        }
    },
    /**
     * 增加作品浏览量
     * @param {String} postId 作品ID
     */
    async addViewCount(postId) {
        if (!postId) {
            return { errCode: 'PARAM_IS_NULL', errMsg: '参数不能为空' }
        }
        try {
            const res = await db.collection('knitting-posts').doc(postId).update({
                views: db.command.inc(1)
            });
            return { errCode: 0, errMsg: 'success', result: res }
        } catch (e) {
            return { errCode: 'UPDATE_FAILED', errMsg: e.message }
        }
    },
    /**
     * 切换点赞状态
     * @param {String} postId 作品ID
     * @param {String} userId 用户ID
     */
    async toggleLike(postId, userId) {
        if (!postId || !userId) {
            return { errCode: 'PARAM_IS_NULL', errMsg: '参数不能为空' }
        }

        try {
            // 检查是否已点赞
            const likeRes = await db.collection('knitting-likes')
                .where({ post_id: postId, user_id: userId })
                .get();

            if (likeRes.data && likeRes.data.length > 0) {
                // 取消点赞
                await db.collection('knitting-likes').doc(likeRes.data[0]._id).remove();
                await db.collection('knitting-posts').doc(postId).update({
                    likes: db.command.inc(-1)
                });
                return { errCode: 0, liked: false }
            } else {
                // 点赞
                await db.collection('knitting-likes').add({
                    post_id: postId,
                    user_id: userId
                });
                await db.collection('knitting-posts').doc(postId).update({
                    likes: db.command.inc(1)
                });
                return { errCode: 0, liked: true }
            }
        } catch (e) {
            return { errCode: 'TOGGLE_LIKE_FAILED', errMsg: e.message }
        }
    },
    /**
     * 检查是否已点赞
     * @param {String} postId 作品ID
     * @param {String} userId 用户ID
     */
    async checkLiked(postId, userId) {
        if (!postId || !userId) {
            return { errCode: 0, liked: false }
        }

        try {
            const likeRes = await db.collection('knitting-likes')
                .where({ post_id: postId, user_id: userId })
                .get();
            return { errCode: 0, liked: likeRes.data && likeRes.data.length > 0 }
        } catch (e) {
            return { errCode: 0, liked: false }
        }
    }
}
