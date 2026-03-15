import { type VideoInfo } from '@/types'

interface VideoInfoCardProps {
  videoInfo: VideoInfo
}

export const VideoInfoCard = ({ videoInfo }: VideoInfoCardProps) => {
  return (
    <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <a
        href={`https://www.youtube.com/watch?v=${videoInfo.videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 overflow-hidden rounded-lg"
      >
        {videoInfo.thumbnail ? (
          <img
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            className="h-20 w-36 object-cover transition-opacity hover:opacity-80"
          />
        ) : (
          <div className="flex h-20 w-36 items-center justify-center bg-gray-100 dark:bg-gray-700">
            <span className="text-xs text-gray-400">No Thumbnail</span>
          </div>
        )}
      </a>
      <div className="flex flex-col justify-center gap-1 overflow-hidden">
        <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
          {videoInfo.title}
        </h2>
        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
          {videoInfo.channel}
        </p>
      </div>
    </div>
  )
}
