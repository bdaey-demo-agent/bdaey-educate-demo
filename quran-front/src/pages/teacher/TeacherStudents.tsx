import React, { useState, useEffect } from 'react';
import teacherService from '../../services/teacherService';
import { UserGroupIcon } from '@heroicons/react/24/outline';

const TeacherStudents: React.FC = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            setLoading(true);
            const data = await teacherService.getMyStudents();
            setStudents(data);
        } catch (error) {
            console.error('Error loading students', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-2 md:p-6">
            <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
                <div className="flex items-center gap-4 mb-4 md:mb-6 px-2 md:px-0">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                        <UserGroupIcon className="h-6 w-6 md:h-8 md:w-8" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">My Students</h1>
                        <p className="text-sm md:text-base text-gray-500">Students who have booked with you</p>
                    </div>
                </div>

                {students.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 p-12 rounded-xl text-center shadow-sm">
                        <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No students yet</h3>
                        <p className="text-gray-500">Students will appear here once they book sessions with you.</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Grid View */}
                        <div className="grid grid-cols-1 gap-3 md:hidden">
                            {students.map((student) => (
                                <div key={student.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-purple-50 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-purple-600 dark:text-purple-400 shrink-0">
                                            {student.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{student.fullName}</h3>
                                            <p className="text-xs text-gray-500 mt-1">{student.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded">
                                        Since {new Date(student.joinDate).toLocaleDateString('en-GB')}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Join Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {students.map((student) => (
                                        <tr key={student.id}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-500 ml-3">
                                                        {student.fullName.charAt(0)}
                                                    </div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{student.fullName}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {student.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(student.joinDate).toLocaleDateString('en-GB')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TeacherStudents;
