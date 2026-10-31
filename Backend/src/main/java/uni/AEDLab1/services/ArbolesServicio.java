package uni.AEDLab1.services;

import java.util.ArrayList;
import org.springframework.stereotype.Service;
import uni.AEDLab1.models.NodoArbolDto;
import uni.AEDLab1.models.ArbolesRespuestaDto;
import uni.AEDLab1.models.DialogoExtensionDto;

@Service
public class ArbolesServicio {
    private NodoArbolDto arbolRaiz;
    private int contadorId = 1;
    private ArrayList<MarcoLlamada> pilaLlamadas = new ArrayList<>();

    private static class MarcoLlamada {
        NodoArbolDto nodo;
        String ladoActual; // "izq" | "der"
        String fase;       // "pregunta" | "ingreso"

        MarcoLlamada(NodoArbolDto nodo, String ladoActual, String fase) {
            this.nodo = nodo;
            this.ladoActual = ladoActual;
            this.fase = fase;
        }
    }
    
    public ArbolesRespuestaDto iniciarArbol(String valor) {
        contadorId = 1;
        arbolRaiz = new NodoArbolDto(contadorId++, valor.toUpperCase());
        pilaLlamadas.clear();
        pilaLlamadas.add(new MarcoLlamada(arbolRaiz, "izq", "pregunta"));
        DialogoExtensionDto dialogo = new DialogoExtensionDto("pregunta", arbolRaiz.getValor(), "izq");
        return new ArbolesRespuestaDto(
            arbolRaiz, dialogo, null, new int[0], false,
            "Árbol iniciado con raíz " + arbolRaiz.getValor() + ". ¿Tiene hijo izquierdo?"
        );
    }
    
    public ArbolesRespuestaDto responderPregunta(boolean tieneHijo) {
        if (pilaLlamadas.isEmpty()) {
            return new ArbolesRespuestaDto(arbolRaiz, null, null, new int[0], false, "El árbol ya está completo.");
        }

        MarcoLlamada tope = pilaLlamadas.get(pilaLlamadas.size() - 1);
        if (tieneHijo) {
            tope.fase = "ingreso";
            DialogoExtensionDto dialogo = new DialogoExtensionDto("ingreso", tope.nodo.getValor(), tope.ladoActual);
            return new ArbolesRespuestaDto(
                arbolRaiz, dialogo, null, new int[0], false,
                "Ingrese el nodo hijo " + (tope.ladoActual.equalsIgnoreCase("izq") ? "izquierdo" : "derecho") + " de " + tope.nodo.getValor()
            );
        }
        
        if (tope.ladoActual.equalsIgnoreCase("izq")) {
            tope.ladoActual = "der";
            tope.fase = "pregunta";
            DialogoExtensionDto dialogo = new DialogoExtensionDto("pregunta", tope.nodo.getValor(), "der");
            return new ArbolesRespuestaDto(
                arbolRaiz, dialogo, null, new int[0], false,
                "¿El nodo " + tope.nodo.getValor() + " tiene hijo derecho?"
            );
        }
        
        // Backtracking
        while (!pilaLlamadas.isEmpty()) {
            pilaLlamadas.remove(pilaLlamadas.size() - 1);
            if (pilaLlamadas.isEmpty()) break;
            
            MarcoLlamada padre = pilaLlamadas.get(pilaLlamadas.size() - 1);
            if (padre.ladoActual.equalsIgnoreCase("izq")) {
                padre.ladoActual = "der";
                padre.fase = "pregunta";
                DialogoExtensionDto dialogo = new DialogoExtensionDto("pregunta", padre.nodo.getValor(), "der");
                return new ArbolesRespuestaDto(
                    arbolRaiz, dialogo, null, new int[0], false,
                    "¿El nodo " + padre.nodo.getValor() + " tiene hijo derecho?"
                );
            }
        }
        
        return new ArbolesRespuestaDto(arbolRaiz, null, null, new int[0], false, "¡Construcción del árbol binario finalizada!");
    }
    
    public ArbolesRespuestaDto confirmarHijo(String valor) {
        if (pilaLlamadas.isEmpty()) {
            throw new IllegalStateException("No hay un nodo activo en construcción.");
        }

        MarcoLlamada tope = pilaLlamadas.get(pilaLlamadas.size() - 1);
        NodoArbolDto nuevoNodo = new NodoArbolDto(contadorId++, valor.toUpperCase());
        
        if (tope.ladoActual.equalsIgnoreCase("izq")) {
            tope.nodo.setIzquierda(nuevoNodo);
        } else {
            tope.nodo.setDerecha(nuevoNodo);
        }
        
        pilaLlamadas.add(new MarcoLlamada(nuevoNodo, "izq", "pregunta"));
        DialogoExtensionDto dialogo = new DialogoExtensionDto("pregunta", nuevoNodo.getValor(), "izq");
        return new ArbolesRespuestaDto(
            arbolRaiz, dialogo, null, new int[0], false,
            "Nodo " + nuevoNodo.getValor() + " agregado. ¿Tiene hijo izquierdo?"
        );
    }
    
    public ArbolesRespuestaDto cancelarHijo() {
        return responderPregunta(false);
    }
    
    public ArbolesRespuestaDto ejecutarRecorrido(String tipo) {
        if (arbolRaiz == null) {
            throw new IllegalArgumentException("No hay un árbol creado para recorrer.");
        }

        ArrayList<Integer> ids = new ArrayList<>();
        ArrayList<String> valores = new ArrayList<>();

        switch (tipo.toLowerCase()) {
            case "preorden" -> preOrdenRecursivo(arbolRaiz, ids, valores);
            case "inorden" -> inOrdenRecursivo(arbolRaiz, ids, valores);
            case "posorden" -> posOrdenRecursivo(arbolRaiz, ids, valores);
            default -> throw new IllegalArgumentException("Tipo de recorrido desconocido: " + tipo);
        }

        int[] nodosResaltados = ids.stream().mapToInt(Integer::intValue).toArray();
        String mensaje = "Recorrido " + tipo + ": " + String.join(" -> ", valores);

        return new ArbolesRespuestaDto(
            arbolRaiz, null, tipo, nodosResaltados, true, mensaje
        );
    }
    
    public void preOrdenRecursivo(NodoArbolDto nodo, ArrayList<Integer> ids, ArrayList<String> valores) {
        if (nodo == null) return;
        ids.add(nodo.getId());
        valores.add(nodo.getValor());
        preOrdenRecursivo(nodo.getIzquierda(), ids, valores);
        preOrdenRecursivo(nodo.getDerecha(), ids, valores);
    }
    
    public void inOrdenRecursivo(NodoArbolDto nodo, ArrayList<Integer> ids, ArrayList<String> valores) {
        if (nodo == null) return;
        inOrdenRecursivo(nodo.getIzquierda(), ids, valores);
        ids.add(nodo.getId());
        valores.add(nodo.getValor());
        inOrdenRecursivo(nodo.getDerecha(), ids, valores);
    }
    
    public void posOrdenRecursivo(NodoArbolDto nodo, ArrayList<Integer> ids, ArrayList<String> valores) {
        if (nodo == null) return;
        posOrdenRecursivo(nodo.getIzquierda(), ids, valores);
        posOrdenRecursivo(nodo.getDerecha(), ids, valores);
        ids.add(nodo.getId());
        valores.add(nodo.getValor());
    }
    
    public ArbolesRespuestaDto reiniciarArbol() {
        arbolRaiz = null;
        contadorId = 1;
        pilaLlamadas.clear();
        return new ArbolesRespuestaDto(null, null, null, new int[0], false, "El árbol se reinició correctamente.");
    }

    public NodoArbolDto getArbolRaiz() {
        return arbolRaiz;
    }
}