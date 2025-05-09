     server                                        client
1. createTransport      ----- init ----------->
2.                      <--- createConsumer ---    createRecvTransport
4. createConsumer
5.                      <---------- connect ---    onConnect
6. consumer connect                                connectionstatechange[connected]
7.                                                 render


Unknown input format: 'alsa'
sudo apt-get install libasound2-dev