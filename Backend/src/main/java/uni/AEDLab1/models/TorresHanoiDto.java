package uni.AEDLab1.models;

public class TorresHanoiDto {
    private int disco;
    private String origen;
    private String destino;

    public TorresHanoiDto(int disco, String origen, String destino) {
        this.disco = disco;
        this.origen = origen;
        this.destino = destino;
    }

    public int getDisco() { return disco; }
    public String getOrigen() { return origen; }
    public String getDestino() { return destino; }
}