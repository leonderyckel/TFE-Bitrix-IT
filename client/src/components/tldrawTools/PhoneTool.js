import { StateNode, createShapeId, toRichText } from 'tldraw'

// Outil pour ajouter un téléphone (emoji texte)
export class PhoneTool extends StateNode {
	static id = 'phone'
	static initial = 'idle'

	onEnter = () => {
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}

	onPointerDown = () => {
		const { currentPagePoint } = this.editor.inputs

		this.editor.createShapes([
			{
				id: createShapeId(),
				type: 'text',
				x: currentPagePoint.x - 12,
				y: currentPagePoint.y - 12,
				props: { richText: toRichText('📱') }, // Emoji phone
			},
		])
	}
} 