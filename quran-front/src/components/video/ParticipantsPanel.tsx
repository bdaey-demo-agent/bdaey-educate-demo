import React from 'react';
import { useParticipantIds, useParticipant, useLocalParticipant } from '@daily-co/daily-react';
import { XMarkIcon, UserIcon, MicrophoneIcon, VideoCameraIcon } from '@heroicons/react/24/solid';

interface ParticipantsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const ParticipantRow: React.FC<{ id: string, isLocal?: boolean }> = ({ id, isLocal }) => {
    // If it's local, we use useLocalParticipant, otherwise useParticipant
    const participant = isLocal ? useLocalParticipant() : useParticipant(id);

    if (!participant) return null;

    const isAudioOn = participant.audio;
    const isVideoOn = participant.video;

    return (
        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-300">
                    <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-white truncate max-w-[120px]">
                        {participant.user_name || 'مستخدم غير معروف'} {isLocal && '(أنت)'}
                    </span>
                    <span className="text-xs text-gray-400">
                        {participant.owner ? 'مدير الجلسة' : 'مشارك'}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-full ${isAudioOn ? 'bg-gray-600 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    <MicrophoneIcon className="w-4 h-4" />
                </div>
                <div className={`p-1.5 rounded-full ${isVideoOn ? 'bg-gray-600 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    <VideoCameraIcon className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
};

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({ isOpen, onClose }) => {
    const localParticipant = useLocalParticipant();
    const remoteParticipantIds = useParticipantIds({ filter: 'remote' });

    if (!isOpen) return null;

    const totalCount = (localParticipant ? 1 : 0) + remoteParticipantIds.length;

    return (
        <div className="absolute right-0 top-0 h-full w-80 bg-gray-800 border-l border-gray-700 flex flex-col z-20 shadow-2xl transition-transform transform translate-x-0">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    المشاركون
                    <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                        {totalCount}
                    </span>
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {localParticipant && (
                    <ParticipantRow id={localParticipant.session_id} isLocal={true} />
                )}

                {remoteParticipantIds.map((id) => (
                    <ParticipantRow key={id} id={id} />
                ))}
            </div>
        </div>
    );
};

export default ParticipantsPanel;
