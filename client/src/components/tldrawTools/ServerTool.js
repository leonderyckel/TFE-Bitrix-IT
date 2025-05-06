import { StateNode, createShapeId, toRichText } from 'tldraw'

// Outil pour ajouter un VRAI serveur (emoji ou texte)
export class ServerTool extends StateNode {
	static id = 'server' // Garde l'ID server
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
				props: { richText: toRichText('🗄️') }, // Emoji classeur
			},
		])
	}
} 