
/**
 * Kontextuelle Referenzierung - So funktionierts:
 *
 * Jede Seite definiert Strips und darin liegende Panels.
 * Der Inhalt eines Panels gibt nur die Anzahl Plot-Items (@) an, die es abbildet.
 * Somit kann man auf eine explizite Referenz von Plot-Items verzichten, womit sich das Problem der Benennung von Plot-Items erübrigt.
 * (Eine chronologische Benennung wäre starr und man könnte nicht einfach elemente einfügen, verschieben oder entfernen,
 *  eine namentliche Benennung wäre schwierig.)
 * Oder anders gesagt: Welches Plot-Item ein Panel abbildet, ist nur durch den Kontext im Plot gegeben. 
 *
 * Um einzelne Zeilen eines Plot-Items zu adressieren, verwendest du die Punkt-Notation (.), z.B: 
 * 	
 * 	[.2] 		heisst: 2 Zeilen des aktuellen Plot-Items.
 *
 * Willst du in einem Panel die letzten Zeilen eines Plotitems zusammen mit einer Anzahl n von darauf folgenden Plot-Items abbilden, verwendest du die Plus-Notation (+):
 * 
 * 	[.2 + 1]	heisst: 2 Zeilen des aktuellen Plot-Items und das darauffolgende Plot-Item.
 *
 * Achtung: enthält das erste Plot-Item weitere Zeilen, werden diese nicht abgebildet!
 * 
 */

Layout = Seite*

Seite = [ Strips* ] 

Strip = Panels*

Panel = [ itemCount ]

itemCount = Integer

