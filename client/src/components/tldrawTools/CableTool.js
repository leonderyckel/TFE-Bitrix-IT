import { StateNode, createShapeId, toRichText } from 'tldraw'

// Outil pour ajouter un "câble" (emoji)
export class CableTool extends StateNode {
	static id = 'cable'
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
				// Utilise l'emoji prise électrique
				props: { richText: toRichText('🔌') }, 
			},
		])
	}
} 