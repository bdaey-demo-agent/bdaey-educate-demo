import React from 'react';
import Seo from '../../components/common/Seo';

const BlogPage: React.FC = () => {
    return (
        <>
            <Seo
                title="المدونة"
                description="مدونة بدائي: مقالات ونصائح عن تحفيظ القرآن الكريم، التجويد، القراءات العشر، وأفضل ممارسات التعليم عن بُعد."
                canonical="https://bdaey.com/blog"
            />
            <BlogContent />
        </>
    )
}

function BlogContent() {
    const posts = [
        {
            id: 1,
            title: "كيف تبدأ حفظ القرآن الكريم؟",
            excerpt: "نصائح عملية وخطوات منهجية للمبتدئين في رحلة حفظ كتاب الله...",
            date: "2024-01-15",
            author: "الشيخ أحمد",
            category: "نصائح تعليمية"
        },
        {
            id: 2,
            title: "أهمية التجويد في القراءة الصحيحة",
            excerpt: "لماذا يعتبر التجويد ركيزة أساسية، وكيف تتقن مخارج الحروف...",
            date: "2024-01-10",
            author: "أ. فاطمة",
            category: "علوم القرآن"
        },
        {
            id: 3,
            title: "تحديثات منصة بدائي الجديدة",
            excerpt: "تعرف على أحدث المميزات التي أضفناها لتسهيل رحلتك التعليمية...",
            date: "2024-01-05",
            author: "فريق المنصة",
            category: "أخبار المنصة"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">المدونة</h1>
                    <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                        مقالات، نصائح، وأخبار تهم كل طالب ومعلم قرآن.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                        <div key={post.id} className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white dark:bg-gray-800">
                            <div className="flex-shrink-0 h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl">
                                📝
                            </div>
                            <div className="flex-1 p-6 flex flex-col justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-600">
                                        {post.category}
                                    </p>
                                    <a href="#" className="block mt-2">
                                        <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                            {post.title}
                                        </p>
                                        <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
                                            {post.excerpt}
                                        </p>
                                    </a>
                                </div>
                                <div className="mt-6 flex items-center">
                                    <div className="flex-shrink-0">
                                        <span className="sr-only">{post.author}</span>
                                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">👤</div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {post.author}
                                        </p>
                                        <div className="flex space-x-1 text-sm text-gray-500">
                                            <time dateTime={post.date}>{post.date}</time>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BlogPage;
