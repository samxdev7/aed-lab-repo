package uni.AEDLab1.models;

public record ArbolesRespuestaDto(
    NodoArbolDto arbol,
    DialogoExtensionDto dialogo,
    String tipoRecorrido,
    int[] nodosResaltados,
    boolean animando,
    String mensajeEstado
) {}