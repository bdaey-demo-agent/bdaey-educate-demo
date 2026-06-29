import React, { useState, useEffect } from 'react';
import teacherService from '../../services/teacherService';
import type { Teacher } from '../../types/teacher';
import { getFileUrl } from '../../utils/mediaUtils';
import toast from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon, DocumentTextIcon, IdentificationIcon, AcademicCapIcon, EyeIcon } from '@heroicons/react/24/outline'; // Adjust imports if needed
import CustomAudioPlayer from '../../components/common/CustomAudioPlayer';
import Modal from '../../components/common/Modal';

const renderThumbnail = (url: string, title: string, onClick: () => void) => {
    const isPdf = url.toLowerCase().endsWith('.pdf');
    return (
        <button
            onClick={onClick}
            className="w-full relative group"
        >
            {isPdf ? (
                <div className="h-40 w-full flex flex-col items-center justify-center rounded border bg-gray-50 dark:bg-gray-800 text-red-500 group-hover:bg-gray-100 transition-colors">
                    <DocumentTextIcon className="h-12 w-12 mb-2" />
                    <span className="text-xs font-medium text-gray-500">{title} (PDF)</span>
                </div>
            ) : (
                <img src={url} className="h-40 w-full object-cover rounded border hover:opacity-90 transition-opacity" alt={title} />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-colors rounded">
                <div className="opacity-0 group-hover:opacity-100 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                    <EyeIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </div>
            </div>
        </button>
    );
};

// Helper to play audio
const AudioPlayer = ({ url }: { url: string }) => {
    if (!url) return <span className="text-gray-400">لا يوجد</span>;
    return (
        <CustomAudioPlayer src={getFileUrl(url)} className="w-48" />
    );
};

const AdminTeacherApproval: React.FC = () => {
    const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null);

    const fetchPendingTeachers = async () => {
        try {
            setLoading(true);
            const data = await teacherService.getPendingTeachers();
            setPendingTeachers(data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch pending teachers", err);
            setError("فشل تحميل قائمة الانتظار");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingTeachers();
    }, []);

    const handleStatusUpdate = async (id: number, status: 'Approved' | 'Rejected') => {
        try {
            await teacherService.updateTeacherStatus(id, status);
            // Remove from list locally
            setPendingTeachers(prev => prev.filter(t => t.id !== id));
            toast.success(`تم ${status === 'Approved' ? 'قبول' : 'رفض'} المعلم بنجاح`);
        } catch (err) {
            console.error("Failed to update status", err);
            toast.error("حدث خطأ أثناء تحديث الحالة");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">طلبات انضمام المعلمين</h1>

                {loading ? (
                    <div className="text-center py-10">جاري التحميل...</div>
                ) : error ? (
                    <div className="text-red-500 text-center py-10">{error}</div>
                ) : pendingTeachers.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">لا يوجد طلبات معلقة حالياً</div>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">المعلم / الهوية</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">المؤهل / الإجازة</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الخبرة</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">المستندات</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">العينة الصوتية</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {pendingTeachers.map((teacher) => (
                                    <tr key={teacher.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img className="h-10 w-10 rounded-full object-cover" src={teacher.imageUrl || teacher.profilePictureUrl || 'https://via.placeholder.com/150'} alt="" />
                                                </div>
                                                <div className="mr-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{teacher.name}</div>
                                                    <div className="flex gap-2 mt-1">
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{teacher.email}</div>
                                                        {teacher.isDataSubmitted ? (
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold rounded-full">بعت البيانات</span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 text-[10px] font-bold rounded-full">لم يرسل البيانات</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {teacher.nationalId && <span className="block">ID: {teacher.nationalId}</span>}
                                                        {teacher.dateOfBirth && <span className="block">DOB: {new Date(teacher.dateOfBirth).toLocaleDateString('en-GB')}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {(teacher.educationDegree === 'bachelor' ? 'بكالوريوس' :
                                                    teacher.educationDegree === 'master' ? 'ماجستير' :
                                                        teacher.educationDegree === 'phd' ? 'دكتوراه' :
                                                            teacher.educationDegree) || '-'}
                                            </div>
                                            {teacher.isHafiz && (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 ml-1">
                                                    حافظ
                                                </span>
                                            )}
                                            {teacher.hasIjaza && (
                                                <div className="mt-1">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        مجاز: {teacher.ijazaType}
                                                    </span>
                                                    {teacher.ijazaIssuer && <div className="text-xs text-gray-500 mt-1">من: {teacher.ijazaIssuer}</div>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {teacher.experienceYears} سنوات
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex flex-wrap gap-2">
                                                {teacher.nationalIdImageUrl && (
                                                    <button
                                                        onClick={() => setViewingDoc({ url: getFileUrl(teacher.nationalIdImageUrl), title: 'صورة الهوية' })}
                                                        className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700" title="صورة الهوية"
                                                    >
                                                        <IdentificationIcon className="h-4 w-4" />
                                                        <span>الهوية</span>
                                                    </button>
                                                )}
                                                {teacher.qualificationCertificateUrl && (
                                                    <button
                                                        onClick={() => setViewingDoc({ url: getFileUrl(teacher.qualificationCertificateUrl), title: 'شهادة المؤهل' })}
                                                        className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700" title="شهادة المؤهل"
                                                    >
                                                        <AcademicCapIcon className="h-4 w-4" />
                                                        <span>المؤهل</span>
                                                    </button>
                                                )}
                                                {teacher.experienceCertificateUrl && (
                                                    <button
                                                        onClick={() => setViewingDoc({ url: getFileUrl(teacher.experienceCertificateUrl), title: 'شهادة الخبرة' })}
                                                        className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700" title="شهادة الخبرة"
                                                    >
                                                        <DocumentTextIcon className="h-4 w-4" />
                                                        <span>الخبرة</span>
                                                    </button>
                                                )}
                                                {teacher.ijazaCertificateUrl ? (
                                                    <button
                                                        onClick={() => setViewingDoc({ url: getFileUrl(teacher.ijazaCertificateUrl), title: 'شهادة الإجازة' })}
                                                        className="flex items-center gap-1 text-xs bg-green-50 hover:bg-green-100 px-2 py-1 rounded text-green-700 border border-green-200" title="شهادة الإجازة"
                                                    >
                                                        <CheckCircleIcon className="h-4 w-4" />
                                                        <span>الإجازة</span>
                                                    </button>
                                                ) : teacher.hasIjaza ? (
                                                    <span className="flex items-center gap-1 text-xs bg-red-50 px-2 py-1 rounded text-red-700 border border-red-200" title="لم يتم رفع الشهادة">
                                                        <XCircleIcon className="h-4 w-4" />
                                                        <span>الإجازة (مفقود)</span>
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <AudioPlayer url={teacher.audioSampleUrl || ''} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedTeacher(teacher)}
                                                className="text-blue-600 hover:text-blue-900 ml-4 font-medium"
                                                title="عرض التفاصيل"
                                            >
                                                عرض التفاصيل
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(teacher.id, 'Approved')}
                                                className="text-green-600 hover:text-green-900 ml-4"
                                                title="قبول"
                                            >
                                                <CheckCircleIcon className="h-6 w-6" />
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(teacher.id, 'Rejected')}
                                                className="text-red-600 hover:text-red-900"
                                                title="رفض"
                                            >
                                                <XCircleIcon className="h-6 w-6" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Teacher Details Modal */}
                {selectedTeacher && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start border-b pb-4 dark:border-gray-700 mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTeacher.name}</h3>
                                    <p className="text-blue-600 font-medium">{selectedTeacher.email}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedTeacher(null)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                                >
                                    <XCircleIcon className="h-8 w-8" />
                                </button>
                            </div>

                            <div className="space-y-6 dir-rtl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">المعلومات الشخصية</h4>
                                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                            <p><span className="font-medium">الهاتف:</span> {selectedTeacher.user?.phoneNumber || 'غير متوفر'}</p>
                                            <p><span className="font-medium">تاريخ الميلاد:</span> {selectedTeacher.dateOfBirth ? new Date(selectedTeacher.dateOfBirth).toLocaleDateString('ar-EG') : '-'}</p>
                                            <p><span className="font-medium">الرقم القومي:</span> {selectedTeacher.nationalId || '-'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">المؤهلات</h4>
                                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                            <p><span className="font-medium">المؤهل:</span> {(selectedTeacher.educationDegree === 'bachelor' ? 'بكالوريوس' :
                                                selectedTeacher.educationDegree === 'master' ? 'ماجستير' :
                                                    selectedTeacher.educationDegree === 'phd' ? 'دكتوراه' :
                                                        selectedTeacher.educationDegree) || '-'}</p>
                                            <p><span className="font-medium">سنوات الخبرة:</span> {selectedTeacher.experienceYears}</p>
                                            <p><span className="font-medium">حافظ:</span> {selectedTeacher.isHafiz ? 'نعم' : 'لا'}</p>
                                            <p><span className="font-medium">مجاز:</span> {selectedTeacher.hasIjaza ? `نعم (${selectedTeacher.ijazaType})` : 'لا'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">المستندات والشهادات</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-2">صورة الهوية</p>
                                            {selectedTeacher.nationalIdImageUrl ? 
                                                renderThumbnail(getFileUrl(selectedTeacher.nationalIdImageUrl), 'صورة الهوية', () => setViewingDoc({ url: getFileUrl(selectedTeacher.nationalIdImageUrl), title: 'صورة الهوية' }))
                                             : <span className="text-red-500 text-sm">غير متوفر</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-2">شهادة الإجازة</p>
                                            {selectedTeacher.ijazaCertificateUrl ? 
                                                renderThumbnail(getFileUrl(selectedTeacher.ijazaCertificateUrl), 'شهادة الإجازة', () => setViewingDoc({ url: getFileUrl(selectedTeacher.ijazaCertificateUrl), title: 'شهادة الإجازة' }))
                                             : selectedTeacher.hasIjaza ? (
                                                <div className="h-40 w-full rounded border-2 border-dashed border-red-300 bg-red-50 flex flex-col items-center justify-center text-red-500 p-4 text-center">
                                                    <XCircleIcon className="h-8 w-8 mb-2" />
                                                    <span className="text-xs font-medium">المعلم ذكر أنه مجاز ولكن لم يرفع الصورة</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">لا يوجد</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-2">المؤهل الدراسي</p>
                                            {selectedTeacher.qualificationCertificateUrl ? 
                                                renderThumbnail(getFileUrl(selectedTeacher.qualificationCertificateUrl), 'شهادة المؤهل', () => setViewingDoc({ url: getFileUrl(selectedTeacher.qualificationCertificateUrl), title: 'شهادة المؤهل' }))
                                             : <span className="text-gray-400 text-sm">لا يوجد</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-2">شهادة الخبرة</p>
                                            {selectedTeacher.experienceCertificateUrl ? 
                                                renderThumbnail(getFileUrl(selectedTeacher.experienceCertificateUrl), 'شهادة الخبرة', () => setViewingDoc({ url: getFileUrl(selectedTeacher.experienceCertificateUrl), title: 'شهادة الخبرة' }))
                                             : <span className="text-gray-400 text-sm">لا يوجد</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                                    <button
                                        onClick={() => setSelectedTeacher(null)}
                                        className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                                    >
                                        إغلاق
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleStatusUpdate(selectedTeacher.id, 'Rejected');
                                            setSelectedTeacher(null);
                                        }}
                                        className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg"
                                    >
                                        رفض
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleStatusUpdate(selectedTeacher.id, 'Approved');
                                            setSelectedTeacher(null);
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg"
                                    >
                                        قبول وتفعيل
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Document Viewer Modal */}
            <Modal
                isOpen={!!viewingDoc}
                onClose={() => setViewingDoc(null)}
                title={viewingDoc?.title}
                size="4xl"
            >
                {viewingDoc && (
                    <div className="flex flex-col items-center">
                        {viewingDoc.url.toLowerCase().endsWith('.pdf') ? (
                            <iframe
                                src={viewingDoc.url}
                                className="w-full h-[70vh] rounded-lg border dark:border-gray-700"
                                title={viewingDoc.title}
                            />
                        ) : (
                            <img
                                src={viewingDoc.url}
                                alt={viewingDoc.title}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border dark:border-gray-700"
                            />
                        )}
                        <div className="mt-4 flex justify-end w-full">
                            <a
                                href={viewingDoc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gold-600 hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300 font-medium flex items-center gap-2"
                            >
                                <span>فتح في نافذة مستقلة</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                            </a>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminTeacherApproval;
