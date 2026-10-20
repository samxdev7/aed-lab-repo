package uni.AEDLab1.models;

public record ColaEstadoDto(
    String[] cola,
    int frente,
    int finalCola,
    int cantidad,
    String mensaje,
    String tipoMensaje,
    String elementoAfectado,
    Integer indiceAfectado
) {}