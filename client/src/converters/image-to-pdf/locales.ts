export const languages = { en: 'English', hi: 'हिन्दी', de: 'Deutsch', fr: 'Français', es: 'Español' } as const
export type Locale = keyof typeof languages
export const localePath = (locale: Locale) => locale === 'en' ? '/image-to-pdf/' : `/${locale}/tools/image-to-pdf/`
export function getLocale(path: string): Locale {
  return (Object.keys(languages) as Locale[]).find(locale => locale !== 'en' && path.replace(/\/+$/, '') === localePath(locale).replace(/\/+$/, '')) ?? 'en'
}
export const localizedRoutes = (Object.keys(languages) as Locale[]).filter(locale => locale !== 'en').map(localePath)

// Each row contains the source label followed by Hindi, German, French and Spanish.
const rows = `Image|चित्र|Bilder|Images|Imágenes
to|से|zu|en|a
Images|चित्र|Bilder|Images|Imágenes
Files stay on your device|फ़ाइलें आपके डिवाइस पर रहती हैं|Dateien bleiben auf deinem Gerät|Les fichiers restent sur votre appareil|Los archivos permanecen en tu dispositivo
Images to convert|बदलने के लिए चित्र|Bilder zum Umwandeln|Images à convertir|Imágenes para convertir
Clear all|सभी हटाएँ|Alle entfernen|Tout effacer|Borrar todo
Drop your images here|अपने चित्र यहाँ छोड़ें|Bilder hier ablegen|Déposez vos images ici|Arrastra tus imágenes aquí
Or choose files from your device|या अपने डिवाइस से फ़ाइलें चुनें|Oder Dateien vom Gerät auswählen|Ou choisissez des fichiers sur votre appareil|O elige archivos de tu dispositivo
Reading images…|चित्र पढ़े जा रहे हैं…|Bilder werden gelesen…|Lecture des images…|Leyendo imágenes…
+ Add more images|+ और चित्र जोड़ें|+ Weitere Bilder|+ Ajouter des images|+ Añadir imágenes
+ Choose images|+ चित्र चुनें|+ Bilder auswählen|+ Choisir des images|+ Elegir imágenes
Up to 60 images · 25 MB per file · 150 MB total|अधिकतम 60 चित्र · प्रति फ़ाइल 25 MB · कुल 150 MB|Bis zu 60 Bilder · 25 MB je Datei · 150 MB insgesamt|Jusqu’à 60 images · 25 Mo par fichier · 150 Mo au total|Hasta 60 imágenes · 25 MB por archivo · 150 MB en total
Drag an image preview to reorder. Arrow buttons work too. Numbers match PDF page order.|क्रम बदलने के लिए चित्र खींचें। तीर वाले बटन भी इस्तेमाल कर सकते हैं। संख्याएँ PDF पृष्ठ क्रम दिखाती हैं।|Vorschaubilder zum Sortieren ziehen oder Pfeiltasten verwenden. Die Zahlen entsprechen der PDF-Seitenfolge.|Faites glisser les aperçus pour les réordonner ou utilisez les flèches. Les numéros indiquent l’ordre des pages PDF.|Arrastra las vistas previas para ordenarlas o usa las flechas. Los números indican el orden de las páginas PDF.
↻ Rotate|↻ घुमाएँ|↻ Drehen|↻ Pivoter|↻ Girar
Some files need attention|कुछ फ़ाइलों में समस्या है|Einige Dateien benötigen Aufmerksamkeit|Certains fichiers nécessitent votre attention|Algunos archivos necesitan atención
PDF controls|PDF नियंत्रण|PDF-Steuerung|Commandes PDF|Controles PDF
PDF settings|PDF सेटिंग्स|PDF-Einstellungen|Paramètres PDF|Ajustes PDF
Fit to image|चित्र के अनुसार|An Bild anpassen|Adapter à l’image|Ajustar a la imagen
US Letter|US Letter|US Letter|US Letter|US Letter
Automatic|स्वचालित|Automatisch|Automatique|Automática
Portrait|लंबवत|Hochformat|Portrait|Vertical
Landscape|आड़ा|Querformat|Paysage|Horizontal
Open|खोलें|Öffnen|Ouvrir|Abrir
Make it yours before downloading.|डाउनलोड से पहले अपनी पसंद चुनें।|Vor dem Download anpassen.|Personnalisez avant de télécharger.|Personaliza antes de descargar.
Close PDF settings|PDF सेटिंग्स बंद करें|PDF-Einstellungen schließen|Fermer les paramètres PDF|Cerrar los ajustes PDF
Image quality|चित्र गुणवत्ता|Bildqualität|Qualité d’image|Calidad de imagen
High — more detail|उच्च — अधिक विवरण|Hoch — mehr Details|Élevée — plus de détails|Alta — más detalle
Balanced — recommended|संतुलित — सुझाया गया|Ausgewogen — empfohlen|Équilibrée — recommandée|Equilibrada — recomendada
Compact — smaller file|कॉम्पैक्ट — छोटी फ़ाइल|Kompakt — kleinere Datei|Compacte — fichier plus petit|Compacta — archivo más pequeño
Images keep their proportions and are never cropped. Transparency becomes white. High quality is not lossless.|चित्रों का अनुपात बना रहता है और वे काटे नहीं जाते। पारदर्शी हिस्से सफ़ेद हो जाते हैं। उच्च गुणवत्ता भी दोषरहित नहीं है।|Bilder behalten ihre Proportionen und werden nicht beschnitten. Transparenz wird weiß. Hohe Qualität ist nicht verlustfrei.|Les proportions sont conservées sans recadrage. La transparence devient blanche. La qualité élevée n’est pas sans perte.|Se mantienen las proporciones sin recortar. La transparencia se vuelve blanca. La calidad alta no es sin pérdida.
File name|फ़ाइल का नाम|Dateiname|Nom du fichier|Nombre del archivo
Sponsor advertisement space|प्रायोजक विज्ञापन स्थान|Platz für Sponsorenwerbung|Espace publicitaire|Espacio publicitario
SPONSOR|प्रायोजक|SPONSOR|SPONSOR|PATROCINADOR
Advertisement space|विज्ञापन स्थान|Werbefläche|Espace publicitaire|Espacio publicitario
Your images are never shared.|आपके चित्र साझा नहीं किए जाते।|Deine Bilder werden nicht geteilt.|Vos images ne sont pas partagées.|Tus imágenes no se comparten.
Quick settings|त्वरित सेटिंग्स|Schnelleinstellungen|Réglages rapides|Ajustes rápidos
Page size|पृष्ठ आकार|Seitengröße|Format de page|Tamaño de página
Orientation|दिशा|Ausrichtung|Orientation|Orientación
Margins|हाशिये|Ränder|Marges|Márgenes
None|कोई नहीं|Keine|Aucune|Ninguno
Small|छोटे|Klein|Petites|Pequeños
Comfortable|पर्याप्त|Großzügig|Confortables|Amplios
Done|हो गया|Fertig|Terminé|Listo
Creating your PDF|आपकी PDF बन रही है|PDF wird erstellt|Création de votre PDF|Creando tu PDF
Reading images|चित्र पढ़े जा रहे हैं|Bilder werden gelesen|Lecture des images|Leyendo imágenes
Ready to create|बनाने के लिए तैयार|Bereit zum Erstellen|Prêt à créer|Listo para crear
Processing…|प्रोसेस हो रहा है…|Verarbeitung…|Traitement…|Procesando…
Loading images…|चित्र लोड हो रहे हैं…|Bilder werden geladen…|Chargement des images…|Cargando imágenes…
Download PDF|PDF डाउनलोड करें|PDF herunterladen|Télécharger le PDF|Descargar PDF
Cancel conversion|रूपांतरण रद्द करें|Umwandlung abbrechen|Annuler la conversion|Cancelar conversión
No uploads. No watermarks. No account.|कोई अपलोड नहीं। कोई वॉटरमार्क नहीं। कोई खाता नहीं।|Kein Upload. Kein Wasserzeichen. Kein Konto.|Sans envoi. Sans filigrane. Sans compte.|Sin subir archivos. Sin marcas de agua. Sin cuenta.
PDF created. Download started.|PDF बन गई। डाउनलोड शुरू हुआ।|PDF erstellt. Download gestartet.|PDF créé. Téléchargement lancé.|PDF creado. Descarga iniciada.
Maximum 60 images per PDF.|प्रति PDF अधिकतम 60 चित्र।|Maximal 60 Bilder pro PDF.|60 images maximum par PDF.|Máximo 60 imágenes por PDF.
Maximum 25 MB per image.|प्रति चित्र अधिकतम 25 MB।|Maximal 25 MB pro Bild.|25 Mo maximum par image.|Máximo 25 MB por imagen.
Maximum 150 MB of images per batch.|प्रति बैच अधिकतम 150 MB।|Maximal 150 MB Bilder pro Durchgang.|150 Mo maximum par lot.|Máximo 150 MB de imágenes por lote.
Maximum 40 megapixels per image.|प्रति चित्र अधिकतम 40 मेगापिक्सल।|Maximal 40 Megapixel pro Bild.|40 mégapixels maximum par image.|Máximo 40 megapíxeles por imagen.
Cannot create preview.|पूर्वावलोकन नहीं बन पाया।|Vorschau konnte nicht erstellt werden.|Impossible de créer l’aperçu.|No se pudo crear la vista previa.
Cannot decode this image. It may be damaged or unsupported by your browser.|चित्र नहीं पढ़ा जा सका। फ़ाइल खराब हो सकती है या ब्राउज़र इसे समर्थित नहीं करता।|Bild nicht lesbar. Es ist möglicherweise beschädigt oder wird nicht unterstützt.|Image illisible. Elle est peut-être endommagée ou non prise en charge.|No se puede leer la imagen. Puede estar dañada o no ser compatible.
This browser cannot decode images locally. Please use a current version of Chrome, Edge, Firefox or Safari.|यह ब्राउज़र चित्र नहीं पढ़ सकता। Chrome, Edge, Firefox या Safari का नया संस्करण इस्तेमाल करें।|Dieser Browser kann Bilder nicht lokal lesen. Nutze eine aktuelle Version von Chrome, Edge, Firefox oder Safari.|Ce navigateur ne peut pas décoder les images localement. Utilisez une version récente de Chrome, Edge, Firefox ou Safari.|Este navegador no puede leer imágenes localmente. Usa una versión actual de Chrome, Edge, Firefox o Safari.
Your browser could not process these images. Try the latest Chrome, Edge or Firefox, or a smaller batch.|ब्राउज़र चित्र प्रोसेस नहीं कर पाया। नया Chrome, Edge या Firefox या कम चित्र इस्तेमाल करें।|Die Bilder konnten nicht verarbeitet werden. Versuche einen aktuellen Browser oder weniger Bilder.|Traitement impossible. Essayez un navigateur récent ou un lot plus petit.|No se pudieron procesar las imágenes. Prueba un navegador actualizado o menos imágenes.
Conversion could not start. This tool needs a browser with Web Workers and OffscreenCanvas.|रूपांतरण शुरू नहीं हुआ। Web Workers और OffscreenCanvas वाला ब्राउज़र चाहिए।|Umwandlung nicht gestartet. Web Workers und OffscreenCanvas sind erforderlich.|La conversion n’a pas démarré. Web Workers et OffscreenCanvas sont nécessaires.|La conversión no pudo iniciarse. Se necesitan Web Workers y OffscreenCanvas.
Conversion failed. Try fewer or smaller images.|रूपांतरण विफल हुआ। कम या छोटे चित्र आज़माएँ।|Umwandlung fehlgeschlagen. Versuche weniger oder kleinere Bilder.|Échec de la conversion. Essayez moins d’images ou des images plus petites.|La conversión falló. Prueba menos imágenes o imágenes más pequeñas.
Unsupported image format. Use JPG, PNG, WebP, GIF, BMP or AVIF.|चित्र प्रारूप समर्थित नहीं है। JPG, PNG, WebP, GIF, BMP या AVIF इस्तेमाल करें।|Bildformat nicht unterstützt. Verwende JPG, PNG, WebP, GIF, BMP oder AVIF.|Format non pris en charge. Utilisez JPG, PNG, WebP, GIF, BMP ou AVIF.|Formato no compatible. Usa JPG, PNG, WebP, GIF, BMP o AVIF.
Remove|हटाएँ|Entfernen|Supprimer|Eliminar
Rotate|घुमाएँ|Drehen|Pivoter|Girar
Move earlier|पहले ले जाएँ|Nach vorne|Déplacer avant|Mover antes
Move later|बाद में ले जाएँ|Nach hinten|Déplacer après|Mover después
Skip to content|सामग्री पर जाएँ|Zum Inhalt|Aller au contenu|Ir al contenido
Language|भाषा|Sprache|Langue|Idioma
Image to PDF|चित्र से PDF|Bilder zu PDF|Images en PDF|Imágenes a PDF
page|पृष्ठ|Seite|page|página
pages|पृष्ठ|Seiten|pages|páginas
Processing|प्रोसेस हो रहा है|Verarbeitung|Traitement|Procesando
of|/|von|sur|de
All rights reserved.|सर्वाधिकार सुरक्षित।|Alle Rechte vorbehalten.|Tous droits réservés.|Todos los derechos reservados.
Terms of Service|सेवा की शर्तें (अंग्रेज़ी)|Nutzungsbedingungen (Englisch)|Conditions d’utilisation (anglais)|Condiciones de uso (inglés)
Privacy Policy|गोपनीयता नीति (अंग्रेज़ी)|Datenschutz (Englisch)|Confidentialité (anglais)|Privacidad (inglés)`
export const translations: Record<string, string[]> = Object.fromEntries(rows.split('\n').map(row => { const [key, ...values] = row.split('|'); return [key, values] }))
translations['Conversion stopped. Your images and settings are unchanged.'] = ['रूपांतरण रोक दिया गया। आपके चित्र और सेटिंग्स नहीं बदले हैं।', 'Umwandlung gestoppt. Bilder und Einstellungen bleiben unverändert.', 'Conversion arrêtée. Vos images et paramètres sont inchangés.', 'Conversión detenida. Tus imágenes y ajustes no han cambiado.']
export function translator(locale: Locale) {
  const index = ['hi', 'de', 'fr', 'es'].indexOf(locale)
  return (key: string) => index < 0 ? key : translations[key]?.[index] ?? key
}
export const localeMetadata: Record<Exclude<Locale, 'en'>, { title: string; description: string }> = {
  hi: { title: 'चित्र से PDF — मुफ्त JPG और PNG कन्वर्टर | Bloomollo', description: 'JPG, PNG और अन्य चित्रों से एक PDF बनाएँ। फ़ाइलें आपके डिवाइस पर प्रोसेस होती हैं। क्रम बदलें, पृष्ठ सेट करें और डाउनलोड करें। खाता या वॉटरमार्क नहीं।' },
  de: { title: 'Bilder in PDF umwandeln — Kostenlos, ohne Upload | Bloomollo', description: 'JPG, PNG und weitere Bilder zu einer PDF zusammenfügen. Lokal im Browser verarbeiten, sortieren und herunterladen. Ohne Konto oder Wasserzeichen.' },
  fr: { title: 'Images en PDF — Convertisseur gratuit sans envoi | Bloomollo', description: 'Convertissez vos JPG, PNG et autres images en un PDF. Traitement local, ordre et mise en page personnalisables. Sans compte ni filigrane.' },
  es: { title: 'Imágenes a PDF — Convertidor gratis sin subir archivos | Bloomollo', description: 'Convierte JPG, PNG y otras imágenes en un PDF. Procesamiento local, orden y formato de página ajustables. Sin cuenta ni marcas de agua.' },
}