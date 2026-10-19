package uni.AEDLab1.models;

public record ColaCircularEstadoDto(
    String[] cola,
    int frente,
    int finalCola,
    int cantidad,
    int capacidad,
    String mensaje,
    String tipoMensaje,
    boolean dioVuelta,
    String elementoAfectado,
    Integer indiceAfectado
) {}
