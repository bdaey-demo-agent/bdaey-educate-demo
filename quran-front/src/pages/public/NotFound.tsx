import { Link } from 'react-router-dom';
import { HomeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Seo from '../../components/common/Seo';

const NotFound = () => {
    return (
        <>
            <Seo title="الصفحة غير موجودة" description="عذراً، الصفحة التي تبحث عنها غير موجودة." noIndex />
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <ExclamationTriangleIcon className="h-16 w-16 text-primary" />
                    </div>
                </div>

                <h1 className="text-4xl font-bold text-gray-900">404</h1>
                <h2 className="text-2xl font-semibold text-gray-800">الصفحة غير موجودة</h2>

                <p className="text-gray-600">
                    يبدو أنك وصلت إلى رابط خاطئ أو أن الصفحة التي تبحث عنها لم تعد موجودة.
                </p>

                <div className="pt-4">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 w-full bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors"
                    >
                        <HomeIcon className="h-5 w-5" />
                        العودة للصفحة الرئيسية
                        </Link>
                    </div>
                </div>
            </div>
            </>
        );
    };

export default NotFound;
