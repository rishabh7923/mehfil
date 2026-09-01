import ytSearch from "yt-search"

export async function searchYoutube(query, maxResult = 20) {
    const cleanedQuery = query.trim()
    if (!cleanedQuery) return []

    const r = await ytSearch(cleanedQuery)
    const videos = (r.videos || []).slice(0, maxResult)

    return videos.map((vid) => {
        return {
            videoId: vid.videoId,
            title: vid.title || 'Untitled',
            channelTitle: vid.author.name || 'Unknown',
            thumbnail: vid.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            duration: vid.seconds || 0,
            durationFormatted: vid.timestamp
        }
    })
}