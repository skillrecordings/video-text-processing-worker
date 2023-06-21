export type Word = {
	word: string
	start: number
	end: number
	confidence: number
	punctuated_word: number
}

function convertTime(inputSeconds: number) {
	const date = new Date(inputSeconds * 1000)
	const hours = String(date.getUTCHours()).padStart(2, '0')
	const minutes = String(date.getUTCMinutes()).padStart(2, '0')
	const seconds = String(date.getUTCSeconds()).padStart(2, '0')
	const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0')

	return `${hours}:${minutes}:${seconds},${milliseconds}`
}

export function srtProcessor(words: Word[]) {
	let timeLimitInSeconds = 5.5
	let charLimit = 42
	let currentTimeInSeconds = 0
	let currentCharCount = 0
	let arrayByTimes: Word[][] = []
	let tempArray: Word[] = []

	words.forEach((item, index) => {
		let timeExceeded = currentTimeInSeconds + (item.end - item.start) >= timeLimitInSeconds
		let charCountExceeded = currentCharCount + item.word.length > charLimit

		if (timeExceeded || charCountExceeded || index === words.length - 1) {
			if (tempArray.length) {
				arrayByTimes.push(tempArray)
				tempArray = []
				currentTimeInSeconds = 0
				currentCharCount = 0
			}
		}

		if (!timeExceeded || !charCountExceeded) {
			tempArray.push(item)
			currentTimeInSeconds += item.end - item.start
			currentCharCount += item.word.length
		}

		if (index === words.length - 1 && (!timeExceeded || !charCountExceeded)) {
			arrayByTimes.push(tempArray)
		}
	})

	let srtEntries = arrayByTimes.map((timeBlock, index) => {
		let startTime = convertTime(timeBlock[0].start)
		let endTime = convertTime(timeBlock[timeBlock.length - 1].end)
		let text = timeBlock.map((x) => x.word).join(' ')
		let srtEntry = `${index + 1}
${startTime} --> ${endTime}
${text}
  `

		return srtEntry
	})

	return srtEntries.join('\n\n')
}
