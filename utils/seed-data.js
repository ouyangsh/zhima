const db = uniCloud.database();

export const seedDiscoverData = async () => {
    try {
        const uid = uniCloud.getCurrentUserInfo().uid;
        if (!uid) return;

        // 1. Check and seed Posts
        const postsCount = await db.collection('knitting-posts').count();
        if (postsCount.result.total === 0) {
            console.log('Seeding posts...');
            const samplePosts = [
                {
                    title: "彩虹毯子",
                    cover: "https://images.unsplash.com/photo-1641644785726-26ec66bfce73?auto=format&fit=crop&w=400&q=80",
                    user_id: uid,
                    user_name: "织女小红",
                    likes: 128,
                    views: 342
                },
                {
                    title: "秋冬围巾",
                    cover: "https://images.unsplash.com/photo-1601987775552-435bbcbfb465?auto=format&fit=crop&w=400&q=80",
                    user_id: uid,
                    user_name: "KnittingMaster",
                    likes: 85,
                    views: 210
                },
                {
                    title: "经典毛衣",
                    cover: "https://images.unsplash.com/photo-1702046508143-eb68172100df?auto=format&fit=crop&w=400&q=80",
                    user_id: uid,
                    user_name: "手作时光",
                    likes: 246,
                    views: 890
                },
                {
                    title: "可爱毛线球",
                    cover: "https://images.unsplash.com/photo-1767281076188-562b285b9cde?auto=format&fit=crop&w=400&q=80",
                    user_id: uid,
                    user_name: "YarnLover",
                    likes: 56,
                    views: 120
                }
            ];

            for (const post of samplePosts) {
                await db.collection('knitting-posts').add(post);
            }
            console.log('Posts seeded.');
        }

        // 2. Check and seed Activities
        const activitiesCount = await db.collection('knitting-activities').where({ user_id: uid }).count();
        if (activitiesCount.result.total === 0) {
            console.log('Seeding activities...');
            const sampleActivities = [
                {
                    user_id: uid,
                    type: "like",
                    from_user_name: "Lisa",
                    from_user_avatar: "",
                    target_title: "彩虹毯子",
                    content: "",
                    is_read: false
                },
                {
                    user_id: uid,
                    type: "comment",
                    from_user_name: "Mary",
                    from_user_avatar: "",
                    target_title: "秋冬围巾",
                    content: "配色太好看了，请问用的什么线？",
                    is_read: false
                },
                {
                    user_id: uid,
                    type: "system",
                    from_user_name: "系统通知",
                    from_user_avatar: "",
                    content: "欢迎来到织嘛！开始记录你的第一个作品吧。",
                    is_read: true
                },
                {
                    user_id: uid,
                    type: "like",
                    from_user_name: "Tom",
                    from_user_avatar: "",
                    target_title: "经典毛衣",
                    content: "",
                    is_read: true
                }
            ];

            for (const activity of sampleActivities) {
                await db.collection('knitting-activities').add(activity);
            }
            console.log('Activities seeded.');
        }

        return true;
    } catch (e) {
        console.error('Seeding failed:', e);
        return false;
    }
};
