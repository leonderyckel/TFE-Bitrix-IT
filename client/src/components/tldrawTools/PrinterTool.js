import { StateNode, createShapeId, toRichText } from 'tldraw'

// Outil pour ajouter une imprimante (représentée par un emoji texte)
export class PrinterTool extends StateNode {
	static id = 'printer'
	static initial = 'idle'
	
	// 'editor' est disponible via this.editor dans les méthodes

	onEnter = () => {
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}

	onPointerDown = () => {
		const { currentPagePoint } = this.editor.inputs

		// Créer une forme texte avec emoji
		this.editor.createShapes([
			{
				id: createShapeId(),
				type: 'text', // Type TEXTE
				x: currentPagePoint.x - 12, // Ajuste la position pour le texte
				y: currentPagePoint.y - 12,
				props: { 
					richText: toRichText('🖨️') // Utilise l'emoji
				}, 
			},
		])
	}
} 